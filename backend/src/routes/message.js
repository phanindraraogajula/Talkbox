const express = require('express');
const router = express.Router();
const { sendMessage, getMessagesWithFriend } = require('../controllers/messageController');

router.post('/send', sendMessage);
router.get('/with/:meId/:friendId', getMessagesWithFriend);

module.exports = router;
