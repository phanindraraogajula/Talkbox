const prisma = require('../db');

// -----------------------------------------
// ADD FRIEND
// -----------------------------------------
const addFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: "You can't add yourself" });
    }

    // Check if friend exists
    const friend = await prisma.user.findUnique({ where: { userId: friendId } });
    if (!friend) return res.status(404).json({ error: 'User with this userId does not exist' });

    // Fetch current user
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ error: 'Current user not found' });

    // Check if already friends
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Add friend
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { friends: { push: friendId } }
    });

    res.json({ message: 'Friend added successfully', friends: updatedUser.friends });
  } catch (err) {
    console.error('Add friend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// -----------------------------------------
// REMOVE FRIEND
// -----------------------------------------
const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedFriends = user.friends.filter(f => f !== friendId);

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { friends: updatedFriends }
    });

    res.json({ message: 'Friend removed', friends: updatedUser.friends });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// -----------------------------------------
// SEARCH USER BY userId
// -----------------------------------------
const searchUser = async (req, res) => {
  try {
    const { query } = req.query; // frontend sends ?query=abc

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const user = await prisma.user.findUnique({
      where: { userId: query },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ exists: false, message: "User not found" });
    }

    res.json({ exists: true, user });
  } catch (err) {
    console.error("Search user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------------------
// LIST FRIENDS
// -----------------------------------------
const listFriends = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ friends: user.friends });
  } catch (err) {
    console.error('List friends error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// EXPORT ALL FUNCTIONS **ONCE**
module.exports = { addFriend, removeFriend, listFriends, searchUser };
