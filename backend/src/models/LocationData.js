const mongoose = require('mongoose');

const locationDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  speed: {
    type: Number,
    min: 0,
    default: 0
  },
  altitude: Number,
  bearing: Number,
  isGeofenceEvent: {
    type: Boolean,
    default: false
  },
  geofenceEvent: {
    geofenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geofence'
    },
    eventType: {
      type: String,
      enum: ['enter', 'exit', 'dwell']
    }
  },
  address: {
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  locationProvider: {
    type: String,
    enum: ['gps', 'network', 'passive'],
    default: 'gps'
  }
}, {
  timestamps: true
});

// Index for faster queries
locationDataSchema.index({ deviceId: 1, timestamp: -1 });
locationDataSchema.index({ timestamp: -1 });
locationDataSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
locationDataSchema.index({ isGeofenceEvent: 1 });

// TTL index to automatically delete location data after 30 days
locationDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to find locations within radius
locationDataSchema.statics.findWithinRadius = function(latitude, longitude, radiusKm, options = {}) {
  const query = {
    'coordinates.latitude': {
      $gte: latitude - (radiusKm / 111.32),
      $lte: latitude + (radiusKm / 111.32)
    },
    'coordinates.longitude': {
      $gte: longitude - (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180)))
    }
  };

  if (options.deviceId) {
    query.deviceId = options.deviceId;
  }

  if (options.startTime || options.endTime) {
    query.timestamp = {};
    if (options.startTime) query.timestamp.$gte = options.startTime;
    if (options.endTime) query.timestamp.$lte = options.endTime;
  }

  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get location history for device
locationDataSchema.statics.getDeviceHistory = function(deviceId, startDate, endDate, limit = 1000) {
  const query = {
    deviceId: deviceId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };

  return this.find(query)
    .sort({ timestamp: 1 })
    .limit(limit);
};

// Virtual for calculating distance from another point
locationDataSchema.virtual('distanceFrom').set(function(point) {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = this._doc.coordinates.latitude - point.latitude;
  const dLon = this._doc.coordinates.longitude - point.longitude;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point.latitude) * Math.cos(this._doc.coordinates.latitude) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
});

module.exports = mongoose.model('LocationData', locationDataSchema);