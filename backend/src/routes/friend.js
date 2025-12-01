const express = require('express');
const router = express.Router();
const { addFriend, removeFriend, listFriends, searchUser } = require('../controllers/friendController');

router.post('/add', addFriend);            // Body: { userId, friendId }
router.post('/remove', removeFriend);      // Body: { userId, friendId }
router.get('/list', listFriends);          // ?userId=
router.get('/search', searchUser);         // ?query=<userId>

module.exports = router;
