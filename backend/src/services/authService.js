const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, role, profile, parentId } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Validate parent-child relationship
      if (role === 'child' && !parentId) {
        throw new Error('Parent ID is required for child accounts');
      }

      if (parentId) {
        const parent = await User.findById(parentId);
        if (!parent || parent.role !== 'parent') {
          throw new Error('Valid parent ID is required');
        }
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = new User({
        email,
        password,
        role,
        profile,
        parentId: role === 'child' ? parentId : null,
        emailVerificationToken: crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex'),
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      await user.save();

      // Generate JWT token
      const token = user.getSignedJwtToken();

      // TODO: Send verification email
      logger.info(`User registered successfully: ${email}`);

      return {
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified
        },
        verificationToken
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Validate email & password
      if (!email || !password) {
        throw new Error('Please provide an email and password');
      }

      // Check for user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account has been deactivated');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.getSignedJwtToken();

      logger.info(`User logged in successfully: ${email}`);

      return {
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          settings: user.settings,
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new token
      const token = user.getSignedJwtToken();

      return {
        success: true,
        token
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      // Get hashed token
      const emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Set as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      logger.info(`Email verified successfully: ${user.email}`);

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not
        return {
          success: true,
          message: 'Password reset email sent'
        };
      }

      // Get reset token
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      // TODO: Send reset email
      logger.info(`Password reset requested for: ${email}`);

      return {
        success: true,
        message: 'Password reset email sent',
        resetToken // In production, don't return this
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, password) {
    try {
      // Get hashed token
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Set new password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Generate token
      const jwtToken = user.getSignedJwtToken();

      logger.info(`Password reset successful: ${user.email}`);

      return {
        success: true,
        token: jwtToken,
        message: 'Password reset successful'
      };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId).populate('parentId', 'email profile');

      if (!user) {
        throw new Error('User not found');
      }

      // Add children if parent
      let children = [];
      if (user.role === 'parent') {
        children = await User.find({ parentId: user._id })
          .select('email profile lastLogin isActive')
          .populate({
            path: 'deviceId',
            select: 'deviceName deviceType isActive lastSeen'
          });
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          settings: user.settings,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          children
        }
      };
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const allowedFields = ['profile', 'settings'];
      const filteredData = {};

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          settings: user.settings
        }
      };
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Check current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed successfully: ${user.email}`);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();