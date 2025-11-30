const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const prisma = require('./db'); // Prisma client
const authRoutes = require('./routes/auth');
const pingRoutes = require('./routes/ping');

// Create Express app
const app = express();

// ====== CORS FIX (REQUIRED FOR FRONTEND) ======
app.use(
  cors({
    origin: 'http://localhost:3000',    // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Handle preflight
app.options('*', cors());

// JSON middleware
app.use(express.json());

// HTTP routes
app.use('/auth', authRoutes);
app.use('/ping', pingRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ===== Active Users + Message Rate Limit =====
const activeUsers = new Map(); // socket.id -> userId
const messageTimestamps = new Map();
const MESSAGE_INTERVAL = 1000;

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1️⃣ User identifies themselves
  socket.on('registerUser', async (userId) => {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      socket.emit('error', 'Invalid userId');
      return;
    }

    // Track active user
    activeUsers.set(socket.id, user.id);
    io.emit('activeUsers', Array.from(activeUsers.values()));

    // Send previous messages (global chat)
    const messages = await prisma.message.findMany({
      where: { receiverId: null },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });

    socket.emit(
      'recentMessages',
      messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderUsername: msg.sender.userId,
        timestamp: msg.createdAt
      }))
    );
  });

  // 2️⃣ User Sends Message
  socket.on('sendMessage', async ({ content }) => {
    const senderId = activeUsers.get(socket.id);
    if (!senderId) return;

    // Rate limit
    const now = Date.now();
    if ((messageTimestamps.get(socket.id) || 0) + MESSAGE_INTERVAL > now) {
      socket.emit('rateLimit', 'You are sending messages too fast!');
      return;
    }

    messageTimestamps.set(socket.id, now);

    // Save message to DB
    const savedMessage = await prisma.message.create({
      data: { content, senderId },
      include: { sender: true }
    });

    // Broadcast message
    io.emit('receiveMessage', {
      id: savedMessage.id,
      content: savedMessage.content,
      senderUsername: savedMessage.sender.userId,
      timestamp: savedMessage.createdAt
    });
  });

  // 3️⃣ Disconnect
  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('activeUsers', Array.from(activeUsers.values()));
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.1.15:${PORT}`);
});
