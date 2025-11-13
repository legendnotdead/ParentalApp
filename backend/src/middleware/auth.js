const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account has been deactivated.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in authentication.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route.`
      });
    }
    next();
  };
};

// Check if user can access child data
exports.canAccessChildData = async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Parents can access their children's data
    if (req.user.role === 'parent') {
      const child = await User.findOne({ _id: childId, parentId: req.user._id });
      if (!child) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Child not found or not associated with this parent.'
        });
      }
    }
    // Children can only access their own data
    else if (req.user.role === 'child') {
      if (req.user._id.toString() !== childId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Children can only access their own data.'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Child access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in authorization.'
    });
  }
};

// Optional authentication - doesn't fail if no token
exports.optional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        logger.warn('Optional auth token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};