const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
  },
  name: {
    type: String,
    required: [true, 'Geofence name is required'],
    trim: true,
    maxlength: [50, 'Geofence name cannot be more than 50 characters']
  },
  type: {
    type: String,
    enum: ['circle', 'polygon'],
    required: [true, 'Geofence type is required']
  },
  coordinates: [{
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
    }
  }],
  radius: {
    type: Number,
    min: 10,
    max: 10000, // 10km max radius
    required: function() {
      return this.type === 'circle';
    }
  },
  address: String,
  isActive: {
    type: Boolean,
    default: true
  },
  schedule: {
    activeDays: [{
      type: Number,
      min: 0, // Sunday
      max: 6  // Saturday
    }],
    startTime: String, // "09:00" format
    endTime: String   // "17:00" format
  },
  notifications: {
    onEnter: {
      type: Boolean,
      default: true
    },
    onExit: {
      type: Boolean,
      default: true
    },
    onDwell: {
      type: Boolean,
      default: false
    },
    dwellTime: {
      type: Number,
      default: 5 // minutes
    }
  },
  color: {
    type: String,
    default: '#4285F4',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  childIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster queries
geofenceSchema.index({ parentId: 1 });
geofenceSchema.index({ isActive: 1 });
geofenceSchema.index({ childIds: 1 });

// Virtual for checking if geofence is active now
geofenceSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isActive) return false;

  // If no schedule specified, it's always active
  if (!this.schedule.activeDays || this.schedule.activeDays.length === 0) {
    return true;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  // Check if current day is active
  if (!this.schedule.activeDays.includes(currentDay)) {
    return false;
  }

  // Check time constraints
  if (this.schedule.startTime && this.schedule.endTime) {
    const [startHour, startMin] = this.schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = this.schedule.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  return true;
});

// Static method to check if point is within circle geofence
geofenceSchema.statics.isPointInCircle = function(point, center, radius) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point.latitude - center.latitude) * Math.PI / 180;
  const dLon = (point.longitude - center.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(center.latitude * Math.PI / 180) * Math.cos(point.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance <= (radius / 1000); // Convert radius from meters to kilometers
};

// Static method to check if point is within polygon geofence
geofenceSchema.statics.isPointInPolygon = function(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;

    const intersect = ((yi > point.latitude) != (yj > point.latitude))
        && (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Instance method to check if point is within geofence
geofenceSchema.methods.containsPoint = function(point) {
  if (this.type === 'circle') {
    return this.constructor.isPointInCircle(point, this.coordinates[0], this.radius);
  } else if (this.type === 'polygon') {
    return this.constructor.isPointInPolygon(point, this.coordinates);
  }
  return false;
};

module.exports = mongoose.model('Geofence', geofenceSchema);