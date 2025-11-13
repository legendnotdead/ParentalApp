const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('parent', 'child').required().messages({
      'any.only': 'Role must be either parent or child',
      'any.required': 'Role is required'
    }),
    profile: Joi.object({
      name: Joi.string().trim().max(50).required().messages({
        'string.max': 'Name cannot be more than 50 characters',
        'any.required': 'Name is required'
      }),
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
      dateOfBirth: Joi.date().max('now').optional()
    }).required(),
    parentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).when('role', {
      is: 'child',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required()
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  updateProfile: Joi.object({
    profile: Joi.object({
      name: Joi.string().trim().max(50),
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/),
      avatar: Joi.string().uri(),
      dateOfBirth: Joi.date().max('now')
    }),
    settings: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean(),
        push: Joi.boolean(),
        sms: Joi.boolean()
      }),
      privacy: Joi.object({
        shareLocation: Joi.boolean(),
        shareScreenTime: Joi.boolean(),
        shareWebActivity: Joi.boolean(),
        shareCommunications: Joi.boolean()
      })
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

const deviceValidation = {
  register: Joi.object({
    deviceId: Joi.string().required(),
    deviceName: Joi.string().trim().max(50).required(),
    deviceType: Joi.string().valid('android', 'ios').required(),
    osVersion: Joi.string().required(),
    appVersion: Joi.string().required(),
    capabilities: Joi.object({
      location: Joi.boolean(),
      accelerometer: Joi.boolean(),
      gyroscope: Joi.boolean(),
      camera: Joi.boolean(),
      microphone: Joi.boolean(),
      fingerprint: Joi.boolean(),
      vpn: Joi.boolean()
    })
  }),

  updateSettings: Joi.object({
    settings: Joi.object({
      locationTracking: Joi.boolean(),
      screenTimeMonitoring: Joi.boolean(),
      webFiltering: Joi.boolean(),
      callMonitoring: Joi.boolean(),
      smsMonitoring: Joi.boolean(),
      appBlocking: Joi.boolean()
    }).required()
  })
};

const locationValidation = {
  update: Joi.object({
    deviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      accuracy: Joi.number().min(0)
    }).required(),
    batteryLevel: Joi.number().min(0).max(100),
    speed: Joi.number().min(0),
    altitude: Joi.number(),
    bearing: Joi.number(),
    locationProvider: Joi.string().valid('gps', 'network', 'passive')
  }),

  history: Joi.object({
    childId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    limit: Joi.number().min(1).max(1000).default(1000)
  })
};

const geofenceValidation = {
  create: Joi.object({
    name: Joi.string().trim().max(50).required(),
    type: Joi.string().valid('circle', 'polygon').required(),
    coordinates: Joi.array().items(
      Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
      })
    ).required(),
    radius: Joi.when('type', {
      is: 'circle',
      then: Joi.number().min(10).max(10000).required(),
      otherwise: Joi.optional()
    }),
    address: Joi.string(),
    schedule: Joi.object({
      activeDays: Joi.array().items(Joi.number().min(0).max(6)),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    }),
    notifications: Joi.object({
      onEnter: Joi.boolean(),
      onExit: Joi.boolean(),
      onDwell: Joi.boolean(),
      dwellTime: Joi.number().min(1).max(60)
    }),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    childIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
  })
};

const screenTimeValidation = {
  usage: Joi.object({
    deviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    packageName: Joi.string().required(),
    appName: Joi.string().required(),
    category: Joi.string().valid(
      'game', 'social', 'education', 'entertainment', 'productivity',
      'communication', 'shopping', 'news', 'health', 'finance', 'travel',
      'photo', 'music', 'video', 'browser', 'system', 'other'
    ),
    usageTime: Joi.number().min(0).required(),
    sessions: Joi.array().items(
      Joi.object({
        startTime: Joi.date(),
        endTime: Joi.date(),
        duration: Joi.number().min(0)
      })
    ),
    dataUsage: Joi.object({
      wifi: Joi.number().min(0),
      mobile: Joi.number().min(0)
    })
  }),

  rules: Joi.object({
    childId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    rules: Joi.array().items(
      Joi.object({
        ruleType: Joi.string().valid('appBlock', 'timeLimit').required(),
        target: Joi.string().required(),
        action: Joi.string().valid('block', 'limit', 'allow').required(),
        value: Joi.number().min(0),
        schedule: Joi.object({
          activeDays: Joi.array().items(Joi.number().min(0).max(6)),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        }),
        isActive: Joi.boolean()
      })
    ).required()
  })
};

const webFilterValidation = {
  classify: Joi.object({
    url: Joi.string().uri().required(),
    title: Joi.string().required(),
    content: Joi.string(),
    deviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  history: Joi.object({
    childId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    category: Joi.string(),
    limit: Joi.number().min(1).max(1000).default(100)
  })
};

const communicationsValidation = {
  call: Joi.object({
    deviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    phoneNumber: Joi.string().required(),
    contactName: Joi.string(),
    direction: Joi.string().valid('incoming', 'outgoing').required(),
    duration: Joi.number().min(0).required(),
    timestamp: Joi.date().required(),
    riskScore: Joi.number().min(0).max(100),
    scamDetected: Joi.boolean()
  }),

  sms: Joi.object({
    deviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    phoneNumber: Joi.string().required(),
    contactName: Joi.string(),
    direction: Joi.string().valid('incoming', 'outgoing').required(),
    content: Joi.string().required(),
    timestamp: Joi.date().required(),
    riskScore: Joi.number().min(0).max(100),
    scamDetected: Joi.boolean()
  })
};

const verificationValidation = {
  request: Joi.object({
    childId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    expectedLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      tolerance: Joi.number().min(10).max(500).default(50)
    }).required(),
    verificationMethod: Joi.string().valid('fingerprint', 'pin', 'photo').required(),
    priority: Joi.string().valid('normal', 'high').default('normal')
  }),

  response: Joi.object({
    requestId: Joi.string().required(),
    actualLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      accuracy: Joi.number().min(0)
    }).required(),
    verified: Joi.boolean().required(),
    verificationMethod: Joi.string().valid('fingerprint', 'pin', 'photo').required(),
    photo: Joi.string().uri(), // Base64 or URL
    notes: Joi.string().max(500)
  })
};

module.exports = {
  authValidation,
  deviceValidation,
  locationValidation,
  geofenceValidation,
  screenTimeValidation,
  webFilterValidation,
  communicationsValidation,
  verificationValidation
};