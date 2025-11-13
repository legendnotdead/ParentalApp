const express = require('express');
const router = express.Router();
const { protect, authorize, canAccessChildData } = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('children', 'email profile lastLogin isActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        settings: user.settings,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        children: user.children
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get children (parent only)
router.get('/children', protect, authorize('parent'), async (req, res, next) => {
  try {
    const children = await User.find({ parentId: req.user._id })
      .select('email profile lastLogin isActive settings')
      .populate({
        path: 'deviceId',
        select: 'deviceName deviceType isActive lastSeen isOnline'
      });

    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    next(error);
  }
});

// Add child account
router.post('/children', protect, authorize('parent'), async (req, res, next) => {
  try {
    // TODO: Implement child account creation
    res.status(501).json({
      success: false,
      error: 'Not implemented yet'
    });
  } catch (error) {
    next(error);
  }
});

// Update child account
router.put('/children/:id', protect, authorize('parent'), canAccessChildData, async (req, res, next) => {
  try {
    // TODO: Implement child account update
    res.status(501).json({
      success: false,
      error: 'Not implemented yet'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;