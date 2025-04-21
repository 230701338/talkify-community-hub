
const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { content, chatId } = req.body;
    
    if (!content || !chatId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Create new message
    const newMessage = {
      sender: req.user._id,
      content,
      chat: chatId,
    };
    
    // Save message to database
    let message = await Message.create(newMessage);
    
    // Populate sender and chat information
    message = await message.populate('sender', 'name email avatar');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name email avatar isOnline',
    });
    
    // Update latest message for this chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:chatId
// @desc    Get all messages for a chat
// @access  Private
router.get('/:chatId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email avatar')
      .populate('chat');
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
