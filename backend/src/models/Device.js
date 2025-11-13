const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true
  },
  deviceName: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [50, 'Device name cannot be more than 50 characters']
  },
  deviceType: {
    type: String,
    enum: ['android', 'ios'],
    required: [true, 'Device type is required']
  },
  osVersion: {
    type: String,
    required: [true, 'OS version is required']
  },
  appVersion: {
    type: String,
    required: [true, 'App version is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  settings: {
    locationTracking: {
      type: Boolean,
      default: true
    },
    screenTimeMonitoring: {
      type: Boolean,
      default: true
    },
    webFiltering: {
      type: Boolean,
      default: true
    },
    callMonitoring: {
      type: Boolean,
      default: false
    },
    smsMonitoring: {
      type: Boolean,
      default: false
    },
    appBlocking: {
      type: Boolean,
      default: true
    }
  },
  capabilities: {
    location: { type: Boolean, default: true },
    accelerometer: { type: Boolean, default: true },
    gyroscope: { type: Boolean, default: true },
    camera: { type: Boolean, default: true },
    microphone: { type: Boolean, default: true },
    fingerprint: { type: Boolean, default: false },
    vpn: { type: Boolean, default: true }
  },
  networkInfo: {
    carrier: String,
    networkType: String, // 'wifi', 'mobile', 'none'
    signalStrength: Number
  },
  storageInfo: {
    totalSpace: Number, // in bytes
    availableSpace: Number // in bytes
  },
  securityInfo: {
    isRooted: { type: Boolean, default: false },
    hasLockScreen: { type: Boolean, default: true },
    lockScreenType: String // 'pin', 'pattern', 'password', 'fingerprint', 'face'
  },
  pairingCode: {
    code: String,
    expires: Date
  },
  pairedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: Date
}, {
  timestamps: true
});

// Index for faster queries
deviceSchema.index({ userId: 1 });
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ isActive: 1 });
deviceSchema.index({ lastSeen: 1 });

// Virtual for checking if device is online (last seen within 5 minutes)
deviceSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo;
});

// Pre-save middleware to update lastSeen when device syncs
deviceSchema.pre('save', function(next) {
  if (this.isModified('lastSyncAt')) {
    this.lastSeen = new Date();
  }
  next();
});

// Static method to generate pairing code
deviceSchema.statics.generatePairingCode = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

module.exports = mongoose.model('Device', deviceSchema);