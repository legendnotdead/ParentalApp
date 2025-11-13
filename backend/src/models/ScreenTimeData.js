const mongoose = require('mongoose');

const screenTimeDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required']
  },
  appName: {
    type: String,
    required: [true, 'App name is required']
  },
  category: {
    type: String,
    enum: [
      'game', 'social', 'education', 'entertainment', 'productivity',
      'communication', 'shopping', 'news', 'health', 'finance', 'travel',
      'photo', 'music', 'video', 'browser', 'system', 'other'
    ],
    default: 'other'
  },
  usageTime: {
    type: Number,
    required: [true, 'Usage time is required'],
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: {
    type: Date,
    required: true,
    default: function() {
      return new Date().setHours(0, 0, 0, 0);
    }
  },
  sessions: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in seconds
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  appIcon: String,
  versionName: String,
  versionCode: Number,
  firstInstallTime: Date,
  lastUpdateTime: Date,
  dataUsage: {
    wifi: Number, // in bytes
    mobile: Number // in bytes
  }
}, {
  timestamps: true
});

// Index for faster queries
screenTimeDataSchema.index({ deviceId: 1, date: -1 });
screenTimeDataSchema.index({ deviceId: 1, timestamp: -1 });
screenTimeDataSchema.index({ packageName: 1, date: -1 });
screenTimeDataSchema.index({ category: 1, date: -1 });

// TTL index to automatically delete screen time data after 90 days
screenTimeDataSchema.index({ date: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get daily usage for device
screenTimeDataSchema.statics.getDailyUsage = function(deviceId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: '$packageName',
        appName: { $first: '$appName' },
        category: { $first: '$category' },
        totalTime: { $sum: '$usageTime' },
        sessionCount: { $sum: { $size: '$sessions' } },
        appIcon: { $first: '$appIcon' }
      }
    },
    {
      $sort: { totalTime: -1 }
    }
  ]);
};

// Static method to get weekly usage summary
screenTimeDataSchema.statics.getWeeklyUsage = function(deviceId, startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          category: '$category'
        },
        totalTime: { $sum: '$usageTime' },
        appCount: { $addToSet: '$packageName' }
      }
    },
    {
      $addFields: {
        uniqueApps: { $size: '$appCount' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        categories: {
          $push: {
            category: '$_id.category',
            time: '$totalTime'
          }
        },
        totalTime: { $sum: '$totalTime' },
        uniqueApps: { $sum: '$uniqueApps' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get app usage trends
screenTimeDataSchema.statics.getAppUsageTrends = function(deviceId, packageName, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        packageName: packageName,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$date',
        usageTime: { $first: '$usageTime' },
        sessionCount: { $first: { $size: '$sessions' } }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get top apps by category
screenTimeDataSchema.statics.getTopAppsByCategory = function(deviceId, category, limit = 10, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        category: category,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$packageName',
        appName: { $first: '$appName' },
        totalTime: { $sum: '$usageTime' },
        sessionCount: { $sum: { $size: '$sessions' } },
        lastUsed: { $max: '$timestamp' }
      }
    },
    {
      $sort: { totalTime: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Virtual for usage time in hours
screenTimeDataSchema.virtual('usageTimeInHours').get(function() {
  return Math.round((this.usageTime / 3600) * 100) / 100;
});

// Virtual for usage time formatted
screenTimeDataSchema.virtual('formattedUsageTime').get(function() {
  const hours = Math.floor(this.usageTime / 3600);
  const minutes = Math.floor((this.usageTime % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

module.exports = mongoose.model('ScreenTimeData', screenTimeDataSchema);