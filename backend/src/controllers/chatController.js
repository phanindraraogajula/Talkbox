const prisma = require('../db');

// Get all global messages
const getMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { receiverId: null },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });

    res.json(messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderUsername: msg.sender.userId,
      timestamp: msg.createdAt
    })));
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get online users (usernames)
const getOnlineUsers = (req, res) => {
  try {
    const io = req.app.get('io');
    if (!io) return res.status(500).json({ error: 'Server error' });

    res.json({ onlineUsers: Array.from(io.activeUsers || []) });
  } catch (err) {
    console.error('Fetch online users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get typing users (usernames)
const getTypingUsers = (req, res) => {
  try {
    const io = req.app.get('io');
    if (!io) return res.status(500).json({ error: 'Server error' });

    res.json({ typingUsers: Array.from(io.typingUsers || []) });
  } catch (err) {
    console.error('Fetch typing users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMessages, getOnlineUsers, getTypingUsers };
