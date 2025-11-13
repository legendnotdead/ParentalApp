const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Device = require('../models/Device');
const validate = require('../middleware/validate');
const { deviceValidation } = require('../utils/validation');

// Get user's devices
router.get('/list', protect, async (req, res, next) => {
  try {
    const devices = await Device.find({ userId: req.user._id })
      .sort({ lastSeen: -1 });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    next(error);
  }
});

// Register new device
router.post('/register', protect, validate(deviceValidation.register), async (req, res, next) => {
  try {
    // TODO: Implement device registration with pairing code
    res.status(501).json({
      success: false,
      error: 'Not implemented yet'
    });
  } catch (error) {
    next(error);
  }
});

// Update device settings
router.put('/:id/settings', protect, validate(deviceValidation.updateSettings), async (req, res, next) => {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { settings: req.body.settings } },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
});

// Delete device
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;