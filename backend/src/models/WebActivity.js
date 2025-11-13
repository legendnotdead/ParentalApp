const mongoose = require('mongoose');

const webActivitySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP or HTTPS URL'
    }
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  category: {
    type: String,
    enum: [
      'adult', 'gambling', 'violence', 'drugs', 'hate', 'malware',
      'social_media', 'gaming', 'education', 'news', 'entertainment',
      'shopping', 'search', 'email', 'banking', 'health', 'travel',
      'technology', 'sports', 'food', 'art', 'science', 'safe', 'unknown'
    ],
    default: 'unknown'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    enum: ['category', 'keyword', 'blacklist', 'parental_control', 'unknown']
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  visitDuration: {
    type: Number,
    min: 0,
    default: 0 // in seconds
  },
  keywords: [String],
  contentType: String,
  metadata: {
    domain: String,
    subdomain: String,
    path: String,
    query: String,
    hash: String,
    ip: String,
    userAgent: String,
    referrer: String
  },
  filterActions: [{
    action: String,
    reason: String,
    timestamp: Date
  }],
  contentAnalysis: {
    explicitContent: Boolean,
    violenceLevel: Number,
    adultContent: Boolean,
    hateSpeech: Boolean,
    malwareDetected: Boolean,
    phishingIndicators: [String],
    suspiciousLinks: [String]
  },
  parentFlags: {
    isFlagged: { type: Boolean, default: false },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    flagReason: String
  }
}, {
  timestamps: true
});

// Index for faster queries
webActivitySchema.index({ deviceId: 1, timestamp: -1 });
webActivitySchema.index({ url: 1 });
webActivitySchema.index({ category: 1 });
webActivitySchema.index({ isBlocked: 1 });
webActivitySchema.index({ riskScore: -1 });
webActivitySchema.index({ timestamp: -1 });

// TTL index to automatically delete web activity data after 30 days
webActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to get web activity summary
webActivitySchema.statics.getWebActivitySummary = function(deviceId, startDate, endDate) {
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
        _id: '$category',
        count: { $sum: 1 },
        blockedCount: {
          $sum: { $cond: ['$isBlocked', 1, 0] }
        },
        totalTime: { $sum: '$visitDuration' },
        avgRiskScore: { $avg: '$riskScore' },
        uniqueDomains: { $addToSet: '$metadata.domain' }
      }
    },
    {
      $addFields: {
        uniqueDomainCount: { $size: '$uniqueDomains' }
      }
    },
    {
      $project: {
        uniqueDomains: 0 // Remove the large array from output
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get high-risk activity
webActivitySchema.statics.getHighRiskActivity = function(deviceId, threshold = 70, limit = 50) {
  return this.find({
    deviceId: deviceId,
    riskScore: { $gte: threshold }
  })
  .sort({ riskScore: -1, timestamp: -1 })
  .limit(limit)
  .populate('deviceId', 'deviceName');
};

// Static method to get most visited domains
webActivitySchema.statics.getMostVisitedDomains = function(deviceId, days = 7, limit = 20) {
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
        _id: '$metadata.domain',
        domain: { $first: '$metadata.domain' },
        visitCount: { $sum: 1 },
        totalTime: { $sum: '$visitDuration' },
        avgRiskScore: { $avg: '$riskScore' },
        blockedCount: {
          $sum: { $cond: ['$isBlocked', 1, 0] }
        },
        lastVisit: { $max: '$timestamp' },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $addFields: {
        avgVisitDuration: { $divide: ['$totalTime', '$visitCount'] }
      }
    },
    {
      $sort: { visitCount: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Virtual for formatted visit duration
webActivitySchema.virtual('formattedDuration').get(function() {
  const duration = this.visitDuration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Pre-save middleware to extract domain from URL
webActivitySchema.pre('save', function(next) {
  if (this.url && !this.metadata.domain) {
    try {
      const url = new URL(this.url);
      this.metadata.domain = url.hostname;
      this.metadata.path = url.pathname;
      this.metadata.query = url.search;
      this.metadata.hash = url.hash;
      this.metadata.subdomain = url.hostname.split('.').length > 2
        ? url.hostname.split('.').slice(0, -2).join('.')
        : '';
    } catch (error) {
      // URL parsing failed, continue without domain extraction
    }
  }
  next();
});

module.exports = mongoose.model('WebActivity', webActivitySchema);