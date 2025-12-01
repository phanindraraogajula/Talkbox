const prisma = require('../db');

// -------------------- SEND PRIVATE MESSAGE --------------------
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body; // userId strings

    // Validate sender exists
    const sender = await prisma.user.findUnique({ where: { userId: senderId } });
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Validate receiver exists
    const receiver = await prisma.user.findUnique({ where: { userId: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Optional: enforce friendship before sending message
    if (!sender.friends.includes(receiverId)) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    // Create private message
    const privateMessage = await prisma.privateMessage.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    res.status(201).json({
      id: privateMessage.id,
      content: privateMessage.content,
      senderId: privateMessage.senderId,
      receiverId: privateMessage.receiverId,
      timestamp: privateMessage.createdAt
    });
  } catch (err) {
    console.error('Send private message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------------- GET MESSAGES BETWEEN TWO USERS --------------------
const getMessagesWithFriend = async (req, res) => {
  try {
    const { meId, friendId } = req.params; // userId strings

    // Fetch all messages between two users
    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: meId, receiverId: friendId },
          { senderId: friendId, receiverId: meId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format response
    res.json(messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      timestamp: msg.createdAt
    })));
  } catch (err) {
    console.error('Fetch private messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { sendMessage, getMessagesWithFriend };
