const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authValidation } = require('../utils/validation');

// Register user
router.post('/register', validate(authValidation.register), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validate(authValidation.login), async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', validate(authValidation.refresh), async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', validate(authValidation.verifyEmail), async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body.token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', validate(authValidation.forgotPassword), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', validate(authValidation.resetPassword), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get current user (protected)
router.get('/me', protect, async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update profile (protected)
router.put('/profile', protect, validate(authValidation.updateProfile), async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Change password (protected)
router.put('/change-password', protect, validate(authValidation.changePassword), async (req, res, next) => {
  try {
    const result = await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Logout (protected)
router.post('/logout', protect, (req, res) => {
  // In a stateless JWT setup, logout is typically handled client-side
  // by removing the token. However, we can implement token blacklisting
  // if needed for additional security.
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;