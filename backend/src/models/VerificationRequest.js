const mongoose = require('mongoose');
const crypto = require('crypto');

const verificationRequestSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Child ID is required']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
  },
  requestId: {
    type: String,
    required: [true, 'Request ID is required'],
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'expired', 'cancelled'],
    default: 'pending'
  },
  expectedLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    tolerance: {
      type: Number,
      required: true,
      min: 10,
      max: 500,
      default: 50
    },
    address: String,
    name: String // e.g., "Home", "School", "Library"
  },
  actualLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      min: 0
    },
    address: String,
    timestamp: Date
  },
  verificationMethod: {
    type: String,
    enum: ['fingerprint', 'pin', 'photo', 'none'],
    required: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  response: {
    verified: Boolean,
    verificationMethod: String,
    notes: String,
    photo: String, // Base64 or URL
    biometricData: String, // Encrypted biometric verification data
    responseTime: Number, // Time taken to respond in seconds
    deviceInfo: {
      batteryLevel: Number,
      isCharging: Boolean,
      networkType: String,
      appVersion: String
    }
  },
  attempts: [{
    timestamp: Date,
    method: String,
    success: Boolean,
    error: String,
    deviceInfo: Object
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['push', 'sms', 'email', 'in_app']
    },
    sent: Boolean,
    sentAt: Date,
    response: {
      delivered: Boolean,
      read: Boolean,
      clicked: Boolean
    }
  }],
  metadata: {
    requestSource: {
      type: String,
      enum: ['parent_app', 'automated', 'geofence_breach', 'schedule'],
      default: 'parent_app'
    },
    reason: String,
    context: Object,
    previousVerification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationRequest'
    }
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
verificationRequestSchema.index({ childId: 1, requestedAt: -1 });
verificationRequestSchema.index({ parentId: 1, requestedAt: -1 });
verificationRequestSchema.index({ requestId: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ priority: 1 });
verificationRequestSchema.index({ expiresAt: 1 });

// TTL index to automatically delete expired requests after 7 days
verificationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Virtual for checking if request is expired
verificationRequestSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for request age in seconds
verificationRequestSchema.virtual('ageInSeconds').get(function() {
  return Math.floor((Date.now() - this.requestedAt) / 1000);
});

// Virtual for distance between expected and actual location
verificationRequestSchema.virtual('locationDistance').get(function() {
  if (!this.expectedLocation || !this.actualLocation) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (this.actualLocation.latitude - this.expectedLocation.latitude) * Math.PI / 180;
  const dLon = (this.actualLocation.longitude - this.expectedLocation.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.expectedLocation.latitude * Math.PI / 180) *
    Math.cos(this.actualLocation.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Convert to meters
});

// Static method to find pending requests for child
verificationRequestSchema.statics.findPendingForChild = function(childId) {
  return this.find({
    childId: childId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, requestedAt: -1 });
};

// Static method to get verification statistics
verificationRequestSchema.statics.getVerificationStats = function(childId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        childId: new mongoose.Types.ObjectId(childId),
        requestedAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$response.responseTime' },
        successRate: {
          $avg: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get verification trends
verificationRequestSchema.statics.getVerificationTrends = function(childId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        childId: new mongoose.Types.ObjectId(childId),
        requestedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$requestedAt" } },
          status: '$status'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$response.responseTime' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count',
            avgResponseTime: '$avgResponseTime'
          }
        },
        totalRequests: { $sum: '$count' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Instance method to mark as verified
verificationRequestSchema.methods.markAsVerified = function(responseData) {
  this.status = 'verified';
  this.respondedAt = new Date();
  this.response = {
    ...responseData,
    verified: true
  };

  if (responseData.location) {
    this.actualLocation = {
      latitude: responseData.location.latitude,
      longitude: responseData.location.longitude,
      accuracy: responseData.location.accuracy,
      address: responseData.location.address,
      timestamp: new Date()
    };
  }

  return this.save();
};

// Instance method to mark as failed
verificationRequestSchema.methods.markAsFailed = function(reason, method) {
  this.status = 'failed';
  this.respondedAt = new Date();
  this.response = {
    verified: false,
    verificationMethod: method,
    notes: reason
  };

  return this.save();
};

// Instance method to cancel request
verificationRequestSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.respondedAt = new Date();
  this.response = {
    verified: false,
    verificationMethod: 'none',
    notes: reason || 'Cancelled by parent'
  };

  return this.save();
};

// Pre-save middleware to check expiration
verificationRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'pending' && this.isExpired) {
    this.status = 'expired';
    this.respondedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);