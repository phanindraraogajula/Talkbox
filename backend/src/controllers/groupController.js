const prisma = require('../db');

// Fetch all groups for a user
const fetchUserGroups = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const groups = await prisma.group.findMany({
      where: { members: { some: { id: user.id } } },
      include: {
        members: { select: { userId: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
          include: { sender: { select: { userId: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(groups);
  } catch (err) {
    console.error('Fetch user groups error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, memberUserIds } = req.body; // ["userId1", "userId2"]
    if (!name || !memberUserIds?.length) {
      return res.status(400).json({ error: 'Group name and members required' });
    }

    const validUsers = await prisma.user.findMany({
      where: { userId: { in: memberUserIds } },
      select: { id: true, userId: true }
    });

    if (validUsers.length !== memberUserIds.length) {
      return res.status(400).json({ error: 'Some userIds are invalid' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        members: { connect: validUsers.map(u => ({ id: u.id })) }
      },
      include: { members: true }
    });

    res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search friends from user's friend list only
const searchFriends = async (req, res) => {
  try {
    const { userId, search = "" } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const user = await prisma.user.findUnique({ where: { userId }, select: { friends: true } });
    if (!user?.friends?.length) return res.json([]);

    const friendsData = await prisma.user.findMany({
      where: { userId: { in: user.friends } },
      select: { id: true, userId: true, firstName: true, lastName: true, createdAt: true }
    });

    const searchLower = search.toLowerCase();
    const filtered = friendsData.filter(f =>
      f.userId.toLowerCase().includes(searchLower) ||
      (f.firstName && f.firstName.toLowerCase().includes(searchLower)) ||
      (f.lastName && f.lastName.toLowerCase().includes(searchLower))
    );

    res.json(filtered);
  } catch (err) {
    console.error("Search friends error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all group messages
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ error: 'groupId required' });

    const messages = await prisma.groupMessage.findMany({
      where: { groupId: parseInt(groupId) },
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderUsername: msg.sender.userId,
      timestamp: msg.createdAt
    })));
  } catch (err) {
    console.error('Get group messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Optional REST: fetch online users in groups
const getOnlineUsers = (req, res) => {
  try {
    const io = req.app.get('io');
    res.json({ onlineUsers: Array.from(io.activeUsers || []) });
  } catch (err) {
    console.error('Fetch online users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Optional REST: fetch typing users per group
const getGroupTypingUsers = (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ error: 'groupId required' });

    const io = req.app.get('io');
    const typingSet = io.groupTyping?.get(parseInt(groupId)) || new Set();
    res.json({ typingUsers: Array.from(typingSet) });
  } catch (err) {
    console.error('Fetch group typing users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  fetchUserGroups,
  createGroup,
  searchFriends,
  getGroupMessages,
  getOnlineUsers,
  getGroupTypingUsers
};
