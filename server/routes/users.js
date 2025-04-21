
const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users or search users by name or email
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};
    
    // Find users excluding the current user
    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select('-password');
    
    console.log(`Found ${users.length} users for search: ${req.query.search || 'all'}`);
    res.json(users);
  } catch (error) {
    console.error('Error in user search:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/online
// @desc    Get all online users
// @access  Private
router.get('/online', protect, async (req, res) => {
  try {
    // Find all users marked as online in the database
    const onlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user._id }
    }).select('-password');
    
    console.log(`Found ${onlineUsers.length} online users`);
    res.json(onlineUsers);
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        isOnline: updatedUser.isOnline,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
