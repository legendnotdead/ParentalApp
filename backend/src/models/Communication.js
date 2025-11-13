const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  type: {
    type: String,
    enum: ['call', 'sms'],
    required: [true, 'Communication type is required']
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed'],
    required: [true, 'Direction is required']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]+$/.test(v);
      },
      message: 'Phone number format is invalid'
    }
  },
  contactName: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact name cannot be more than 50 characters']
  },
  duration: {
    type: Number,
    min: 0,
    required: function() {
      return this.type === 'call';
    }
  },
  content: {
    type: String,
    maxlength: [1600, 'SMS content cannot be more than 1600 characters'],
    required: function() {
      return this.type === 'sms';
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  scamDetected: {
    type: Boolean,
    default: false
  },
  scamType: {
    type: String,
    enum: [
      'premium_rate', 'lottery_scam', 'phishing', 'tech_support',
      'impersonation', 'investment_scam', 'job_scam', 'charity_scam',
      'emergency_scam', 'unknown'
    ]
  },
  scamIndicators: [String],
  emergencyIndicators: {
    isEmergency: { type: Boolean, default: false },
    keywords: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  contactInfo: {
    isInContacts: { type: Boolean, default: false },
    contactId: String,
    contactPhoto: String,
    relationship: String,
    isBlocked: { type: Boolean, default: false },
    trustLevel: {
      type: String,
      enum: ['unknown', 'low', 'medium', 'high'],
      default: 'unknown'
    }
  },
  callDetails: {
    callType: {
      type: String,
      enum: ['voice', 'video', 'conference'],
      default: 'voice'
    },
    isVoicemail: { type: Boolean, default: false },
    ringDuration: Number,
    connectionQuality: String,
    networkType: String
  },
  smsDetails: {
    messageType: {
      type: String,
      enum: ['text', 'mms', 'binary'],
      default: 'text'
    },
    hasMedia: { type: Boolean, default: false },
    mediaType: String,
    attachments: [{
      type: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    isGroupMessage: { type: Boolean, default: false },
    groupId: String,
    participantCount: Number
  },
  aiAnalysis: {
    sentiment: {
      score: Number, // -1 to 1
      label: String  // positive, negative, neutral
    },
    language: String,
    topics: [String],
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }],
    intent: String,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  parentalFlags: {
    isFlagged: { type: Boolean, default: false },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    flagReason: String,
    flagCategory: {
      type: String,
      enum: ['inappropriate_content', 'stranger_danger', 'scam', 'emergency', 'other']
    }
  },
  processingStatus: {
    analyzed: { type: Boolean, default: false },
    analyzedAt: Date,
    version: String,
    error: String
  }
}, {
  timestamps: true
});

// Index for faster queries
communicationSchema.index({ deviceId: 1, timestamp: -1 });
communicationSchema.index({ phoneNumber: 1, timestamp: -1 });
communicationSchema.index({ type: 1, timestamp: -1 });
communicationSchema.index({ scamDetected: 1 });
communicationSchema.index({ riskScore: -1 });
communicationSchema.index({ 'emergencyIndicators.isEmergency': 1 });
communicationSchema.index({ timestamp: -1 });

// TTL index to automatically delete communication data after 90 days
communicationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get communication summary
communicationSchema.statics.getCommunicationSummary = function(deviceId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        totalCount: { $sum: 1 },
        incomingCount: {
          $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
        },
        outgoingCount: {
          $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
        },
        missedCount: {
          $sum: { $cond: [{ $eq: ['$direction', 'missed'] }, 1, 0] }
        },
        scamCount: {
          $sum: { $cond: ['$scamDetected', 1, 0] }
        },
        highRiskCount: {
          $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] }
        },
        emergencyCount: {
          $sum: { $cond: ['$emergencyIndicators.isEmergency', 1, 0] }
        },
        totalCallDuration: {
          $sum: { $cond: [{ $eq: ['$type', 'call'] }, '$duration', 0] }
        },
        avgRiskScore: { $avg: '$riskScore' },
        uniqueNumbers: { $addToSet: '$phoneNumber' }
      }
    },
    {
      $addFields: {
        uniqueNumberCount: { $size: '$uniqueNumbers' }
      }
    },
    {
      $project: {
        uniqueNumbers: 0 // Remove the large array from output
      }
    }
  ]);
};

// Static method to get suspicious communications
communicationSchema.statics.getSuspiciousCommunications = function(deviceId, limit = 50) {
  return this.find({
    deviceId: deviceId,
    $or: [
      { scamDetected: true },
      { riskScore: { $gte: 70 } },
      { 'emergencyIndicators.isEmergency': true }
    ]
  })
  .sort({ riskScore: -1, timestamp: -1 })
  .limit(limit)
  .populate('deviceId', 'deviceName');
};

// Static method to get frequent contacts
communicationSchema.statics.getFrequentContacts = function(deviceId, days = 30, limit = 20) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$phoneNumber',
        phoneNumber: { $first: '$phoneNumber' },
        contactName: { $first: '$contactName' },
        isInContacts: { $first: '$contactInfo.isInContacts' },
        totalCommunications: { $sum: 1 },
        callCount: {
          $sum: { $cond: [{ $eq: ['$type', 'call'] }, 1, 0] }
        },
        smsCount: {
          $sum: { $cond: [{ $eq: ['$type', 'sms'] }, 1, 0] }
        },
        totalCallDuration: {
          $sum: { $cond: [{ $eq: ['$type', 'call'] }, '$duration', 0] }
        },
        scamCount: {
          $sum: { $cond: ['$scamDetected', 1, 0] }
        },
        avgRiskScore: { $avg: '$riskScore' },
        lastCommunication: { $max: '$timestamp' },
        directions: { $addToSet: '$direction' }
      }
    },
    {
      $addFields: {
        hasIncoming: { $in: ['incoming', '$directions'] },
        hasOutgoing: { $in: ['outgoing', '$directions'] }
      }
    },
    {
      $sort: { totalCommunications: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Virtual for risk level
communicationSchema.virtual('riskLevel').get(function() {
  if (this.riskScore >= 80) return 'critical';
  if (this.riskScore >= 60) return 'high';
  if (this.riskScore >= 40) return 'medium';
  return 'low';
});

// Virtual for formatted duration
communicationSchema.virtual('formattedDuration').get(function() {
  if (this.type !== 'call' || !this.duration) return 'N/A';

  const duration = this.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
});

module.exports = mongoose.model('Communication', communicationSchema);