require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const prisma = require('./db');

// Routes
const authRoutes = require('./routes/auth');
const pingRoutes = require('./routes/ping');
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group');
const friendRoutes = require('./routes/friend');
const messageRoutes = require('./routes/message');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// REST routes
app.use('/auth', authRoutes);
app.use('/ping', pingRoutes);
app.use('/chat', chatRoutes);
app.use('/group', groupRoutes);
app.use('/friend', friendRoutes);
app.use('/message', messageRoutes);


// HTTP server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Attach io to app for REST controller access
app.set('io', io);

// Maps for tracking users and typing
const activeUsers = new Map(); // socket.id -> username
const typingUsers = new Set();  // global typing
const messageTimestamps = new Map();
const MESSAGE_INTERVAL = 1000;

// Maps for groups
const groupSockets = new Map(); // groupId -> Set<socket.id>
const groupTyping = new Map();  // groupId -> Set<username>

io.activeUsers = activeUsers;
io.typingUsers = typingUsers;

// Helper functions
const broadcastOnlineUsers = () => {
  activeUsers.forEach((username, socketId) => {
    const others = Array.from(activeUsers.values()).filter(u => u !== username);
    io.to(socketId).emit('activeUsers', others);
  });
};

const broadcastTypingUsers = () => {
  activeUsers.forEach((username, socketId) => {
    const othersTyping = Array.from(typingUsers).filter(u => u !== username);
    io.to(socketId).emit('typingUsers', othersTyping);
  });
};

// ===== Socket.IO Connection =====
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ---- Register user (global chat) ----
  socket.on('registerUser', async (userId) => {
    try {
      const user = await prisma.user.findUnique({ where: { userId } });
      if (!user) return socket.emit('error', 'Invalid userId');

      activeUsers.set(socket.id, user.userId);
      broadcastOnlineUsers();

      const messages = await prisma.message.findMany({
        where: { receiverId: null },
        include: { sender: true },
        orderBy: { createdAt: 'asc' }
      });

      socket.emit('recentMessages', messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderUsername: msg.sender.userId,
        timestamp: msg.createdAt
      })));
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Server error');
    }
  });

  // ---- Global typing ----
  socket.on('typing', (isTyping) => {
    const username = activeUsers.get(socket.id);
    if (!username) return;

    if (isTyping) typingUsers.add(username);
    else typingUsers.delete(username);

    broadcastTypingUsers();
  });

  // ---- Send global message ----
  socket.on('sendMessage', async ({ content }) => {
    const username = activeUsers.get(socket.id);
    if (!username) return;

    const now = Date.now();
    if ((messageTimestamps.get(socket.id) || 0) + MESSAGE_INTERVAL > now) {
      return socket.emit('rateLimit', 'You are sending messages too fast!');
    }
    messageTimestamps.set(socket.id, now);

    const sender = await prisma.user.findUnique({ where: { userId: username } });
    const savedMessage = await prisma.message.create({
      data: { content, senderId: sender.id, receiverId: null },
      include: { sender: true }
    });

    io.emit('receiveMessage', {
      id: savedMessage.id,
      content: savedMessage.content,
      senderUsername: savedMessage.sender.userId,
      timestamp: savedMessage.createdAt
    });
  });

  // ---- Group chat ----
  socket.on('joinGroup', async (groupId) => {
    if (!groupSockets.has(groupId)) groupSockets.set(groupId, new Set());
    groupSockets.get(groupId).add(socket.id);

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    });

    socket.emit('groupMessages', messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderUsername: msg.sender.userId,
      timestamp: msg.createdAt
    })));
  });

  socket.on('sendGroupMessage', async ({ groupId, content }) => {
    const username = activeUsers.get(socket.id);
    if (!username) return;

    const sender = await prisma.user.findUnique({ where: { userId: username } });
    const savedMessage = await prisma.groupMessage.create({
      data: { content, groupId, senderId: sender.id },
      include: { sender: true }
    });

    const sockets = groupSockets.get(groupId) || new Set();
    sockets.forEach(sockId => {
      io.to(sockId).emit('receiveGroupMessage', {
        id: savedMessage.id,
        content: savedMessage.content,
        senderUsername: savedMessage.sender.userId,
        timestamp: savedMessage.createdAt
      });
    });
  });

  socket.on('groupTyping', ({ groupId, isTyping }) => {
    const username = activeUsers.get(socket.id);
    if (!username) return;
  
    if (!groupTyping.has(groupId)) groupTyping.set(groupId, new Set());
    const typingSet = groupTyping.get(groupId);
  
    if (isTyping) typingSet.add(username);
    else typingSet.delete(username);
  
    const sockets = groupSockets.get(groupId) || new Set();
    const typingUsersArray = Array.from(typingSet).filter(u => u !== username);
  
    sockets.forEach(sockId => {
      io.to(sockId).emit('groupTypingUsers', { groupId, typingUsers: typingUsersArray });
    });
  });
  // ---- Private chat ----
socket.on('joinPrivate', (username) => {
  // Join a private room for this user
  socket.join(username);
});

socket.on('sendPrivateMessage', async ({ sender, receiver, content }) => {
  try {
    const senderUser = await prisma.user.findUnique({ where: { userId: sender } });
    const receiverUser = await prisma.user.findUnique({ where: { userId: receiver } });
    if (!senderUser || !receiverUser) return socket.emit('error', 'Invalid sender or receiver');

    // Save message to DB
    const savedMessage = await prisma.message.create({
      data: { content, senderId: senderUser.id, receiverId: receiverUser.id },
      include: { sender: true }
    });

    const messageData = {
      id: savedMessage.id,
      content: savedMessage.content,
      senderUsername: savedMessage.sender.userId,
      receiverUsername: receiver,
      timestamp: savedMessage.createdAt
    };

    // Emit to sender and receiver only
    io.to(sender).to(receiver).emit('receivePrivateMessage', messageData);
  } catch (err) {
    console.error(err);
    socket.emit('error', 'Server error');
  }
});


  // ---- Disconnect ----
  socket.on('disconnect', () => {
    const username = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    typingUsers.delete(username);

    broadcastOnlineUsers();
    broadcastTypingUsers();

    // Remove from all groups
    groupSockets.forEach((sockets) => sockets.delete(socket.id));
    groupTyping.forEach((set) => set.delete(username));

    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
