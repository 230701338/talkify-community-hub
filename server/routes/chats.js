
const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chats
// @desc    Create or access one-to-one chat
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }
    
    // Check if chat already exists
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');
    
    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name email avatar',
    });
    
    if (chat.length > 0) {
      res.json(chat[0]);
    } else {
      // Create new chat
      const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user._id, userId],
      };
      
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate(
        'users',
        '-password'
      );
      
      res.status(201).json(fullChat);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chats
// @desc    Get all chats for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('users', '-password')
      .populate('admin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });
    
    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name email avatar',
    });
    
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/group
// @desc    Create a group chat
// @access  Private
router.post('/group', protect, async (req, res) => {
  try {
    const { name, users } = req.body;
    
    if (!name || !users) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Parse users if sent as string
    let usersList = users;
    if (typeof users === 'string') {
      usersList = JSON.parse(users);
    }
    
    if (usersList.length < 2) {
      return res.status(400).json({ message: 'A group chat requires at least 3 users (including yourself)' });
    }
    
    // Add current user to group
    usersList.push(req.user._id);
    
    // Create group chat
    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: usersList,
      admin: req.user._id,
    });
    
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('admin', '-password');
    
    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chats/rename
// @desc    Rename a group chat
// @access  Private
router.put('/rename', protect, async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate('users', '-password')
      .populate('admin', '-password');
    
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chats/add
// @desc    Add user to group
// @access  Private
router.put('/add', protect, async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    
    // Check if chat exists and is a group chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(400).json({ message: 'Invalid chat or not a group chat' });
    }
    
    // Check if current user is admin
    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add users' });
    }
    
    // Add user to group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('admin', '-password');
    
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chats/remove
// @desc    Remove user from group
// @access  Private
router.put('/remove', protect, async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    
    // Check if chat exists and is a group chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(400).json({ message: 'Invalid chat or not a group chat' });
    }
    
    // Check if current user is admin or removing themselves
    if (
      chat.admin.toString() !== req.user._id.toString() &&
      userId !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to remove user' });
    }
    
    // Remove user from group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('admin', '-password');
    
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chats/:id
// @desc    Get a specific chat by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    let chat = await Chat.findById(req.params.id)
      .populate('users', '-password')
      .populate('admin', '-password')
      .populate('latestMessage');
    
    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name email avatar',
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
