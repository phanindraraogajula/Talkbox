const express = require('express');
const router = express.Router();
const {
  fetchUserGroups,
  createGroup,
  searchFriends,
  getGroupMessages,
  getOnlineUsers,
  getGroupTypingUsers
} = require('../controllers/groupController');

// REST endpoints
router.get('/fetch', fetchUserGroups);            // ?userId=1234
router.post('/create', createGroup);             // body: { name, memberUserIds: ["1234","phanindra07"] }
router.get('/search-friends', searchFriends);   // ?userId=1234&search=abc
router.get('/messages', getGroupMessages);      // ?groupId=1
router.get('/online-users', getOnlineUsers);    // Optional: online users globally
router.get('/typing-users', getGroupTypingUsers); // ?groupId=1

module.exports = router;
