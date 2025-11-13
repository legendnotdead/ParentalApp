const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      logger.warn('Validation error:', error);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessage
      });
    }

    next();
  };
};

// For validating query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      logger.warn('Query validation error:', error);

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorMessage
      });
    }

    next();
  };
};

// For validating URL parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      logger.warn('Params validation error:', error);

      return res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: errorMessage
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams
};