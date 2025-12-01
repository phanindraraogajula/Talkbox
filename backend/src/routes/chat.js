const express = require('express');
const router = express.Router();
const { getMessages, getOnlineUsers, getTypingUsers } = require('../controllers/chatController');

router.get('/messages', getMessages);
router.get('/online-users', getOnlineUsers);
router.get('/typing-users', getTypingUsers);

module.exports = router;
