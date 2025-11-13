# Parental Control App

A comprehensive parental control application with real-time monitoring, location tracking, screen time management, web filtering, call/SMS monitoring with AI scam detection, and fingerprint location verification.

## Overview

The Parental Control App consists of three main components:

1. **Backend API** - Node.js/Express server with MongoDB/Redis for data processing and real-time communication
2. **Parent App** - Native Android application for monitoring and control
3. **Child App** - Native Android application with system-level monitoring capabilities

## Features

### 🎯 Core Features

- **Location Tracking & Geofencing**: Real-time GPS tracking with customizable geofence zones
- **Screen Time Management**: Monitor app usage and set time limits for specific apps or categories
- **Web Content Filtering**: AI-powered content analysis and blocking of inappropriate websites
- **Call & SMS Monitoring**: Real-time monitoring with AI-powered scam detection
- **Fingerprint Verification**: Biometric location verification system
- **Real-time Notifications**: Instant alerts for important events

### 🛡️ Security & Privacy

- End-to-end encryption for sensitive data
- GDPR and COPPA compliant
- Secure biometric authentication
- Role-based access control

## Architecture

```
ParentalControl/
├── backend/                    # Node.js backend API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utility functions
│   └── tests/                 # Test suites
├── parent-app/                # Parent Android app
│   ├── app/src/main/java/
│   │   └── com/parentalcontrol/parent/
│   │       ├── ui/            # UI components
│   │       ├── data/          # Data layer
│   │       ├── domain/        # Business domain
│   │       └── utils/         # Utilities
│   └── app/src/test/          # Android tests
├── child-app/                 # Child Android app
│   ├── app/src/main/java/
│   │   └── com/parentalcontrol/child/
│   │       ├── services/      # Background services
│   │       ├── receivers/     # Broadcast receivers
│   │       ├── ui/            # UI components
│   │       ├── data/          # Data layer
│   │       ├── security/      # Security components
│   │       └── utils/         # Utilities
│   └── app/src/test/          # Android tests
└── shared-models/             # Shared data models
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 7.0+
- Redis 6.0+
- Android Studio Hedgehog (2023.1.1) or later
- Android SDK API 34

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ParentalApp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Parent App Setup**
   ```bash
   # Open in Android Studio
   # File -> Open -> parent-app
   # Add google-services.json to parent-app/app/
   # Set MAPS_API_KEY in local.properties
   ```

4. **Child App Setup**
   ```bash
   # Open in Android Studio
   # File -> Open -> child-app
   # Add google-services.json to child-app/app/
   # Configure build variants
   ```

### Configuration

#### Backend Environment Variables

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/parental-control
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
OPENAI_API_KEY=your-openai-api-key
```

#### Android Configuration

Create `local.properties` in both Android apps:

```properties
# parent-app/local.properties
API_BASE_URL=http://10.0.2.2:3000/api/v1
WEBSOCKET_URL=http://10.0.2.2:3000
MAPS_API_KEY=your-google-maps-api-key

# child-app/local.properties
API_BASE_URL=http://10.0.2.2:3000/api/v1
WEBSOCKET_URL=http://10.0.2.2:3000
```

## Testing

### Automated Testing

Run the comprehensive test suite:

```bash
./comprehensive_test.sh
```

Run specific test groups:

```bash
# Backend tests only
./comprehensive_test.sh --backend

# Android tests only
./comprehensive_test.sh --android

# Code quality checks only
./comprehensive_test.sh --quality
```

### Backend Testing

```bash
cd backend

# Install dependencies
npm install

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Android Testing

```bash
# Parent App
cd parent-app

# Run unit tests
./gradlew testDebugUnitTest

# Run instrumented tests
./gradlew connectedDebugAndroidTest

# Generate lint report
./gradlew lintDebug

# Child App
cd child-app

# Run unit tests
./gradlew testDebugUnitTest

# Run instrumented tests
./gradlew connectedDebugAndroidTest
```

## API Documentation

### Authentication Endpoints

```
POST /api/v1/auth/register      # Register new user
POST /api/v1/auth/login         # User login
POST /api/v1/auth/refresh       # Refresh JWT token
POST /api/v1/auth/verify-email  # Verify email address
POST /api/v1/auth/forgot-password # Reset password request
```

### Location Endpoints

```
POST /api/v1/location/update    # Update device location
GET  /api/v1/location/history/:childId # Get location history
GET  /api/v1/location/current/:childId  # Get current location
```

### Screen Time Endpoints

```
POST /api/v1/screentime/usage   # Report app usage
GET  /api/v1/screentime/reports/:childId # Get usage reports
PUT  /api/v1/screentime/rules/:childId   # Set time limits
```

## Android Studio Testing Workflow

### 1. Environment Setup

1. **Install Android Studio Hedgehog or later**
2. **Install required SDK components:**
   - Android 14 (API 34)
   - Android 13 (API 33)
   - Google Play Services
   - Google APIs Intel x86 Atom_64 System Image

### 2. Create Virtual Devices

Create multiple AVDs for testing:

- **Primary Testing Device**: Pixel 6 Pro, API 34, 4GB RAM
- **Legacy Testing Device**: Pixel 4, API 30, 4GB RAM
- **Low-end Testing Device**: Small phone, API 33, 2GB RAM

### 3. Build and Test

1. **Open projects in Android Studio**
2. **Sync Gradle files**
3. **Run tests:**
   ```bash
   ./gradlew clean
   ./gradlew testDebugUnitTest
   ./gradlew connectedDebugAndroidTest
   ```

### 4. Performance Testing

```bash
# Memory profiling
adb shell dumpsys meminfo com.parentalcontrol.parent

# Battery profiling
adb shell dumpsys batterystats --reset
# Run app for testing period
adb shell dumpsys batterystats
```

## Development

### Git Workflow

```bash
# Feature branch naming
feature/location-tracking
feature/screentime-monitoring
feature/web-filtering

# Commit message format
feat: Add location tracking service
fix: Resolve app blocking issue
test: Add unit tests for scam detection
docs: Update API documentation
```

### Code Standards

- Follow official Kotlin style guide
- Enforce with ktlint
- 4-space indentation
- CamelCase for variables and functions
- PascalCase for classes and interfaces

## Security Considerations

### Data Protection

- All sensitive data encrypted using AES-256
- Secure key storage with Android Keystore
- Certificate pinning to prevent MITM attacks
- Regular security audits and penetration testing

### Privacy Compliance

- GDPR compliance with right to access, rectify, and delete data
- COPPA compliance for children under 13
- Data retention policies with automatic cleanup
- Clear consent mechanisms for data collection

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check Redis is running
redis-cli ping

# Check ports are not in use
netstat -tulpn | grep :3000
```

**Android build errors:**
```bash
# Clean and rebuild
./gradlew clean
./gradlew build

# Clear Gradle cache
./gradlew --stop
rm -rf ~/.gradle/caches
```

**Permission issues:**
```bash
# Grant permissions manually
adb shell pm grant com.parentalcontrol.child android.permission.ACCESS_FINE_LOCATION
```

## Deployment

### Backend Deployment

```bash
# Using Docker
cd backend
docker build -t parental-control-api .
docker run -p 3000:3000 parental-control-api

# Using PM2 for production
npm install -g pm2
pm2 start ecosystem.config.js
```

### Android Deployment

```bash
# Debug build
./gradlew assembleDebug

# Release build (requires signing config)
./gradlew assembleRelease

# Play Store bundle
./gradlew bundleRelease
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Email: support@parentalcontrol.com
- Documentation: [Wiki](https://github.com/parentalcontrol/app/wiki)

## Changelog

### v1.0.0
- Initial release
- Core functionality implemented
- Comprehensive testing suite
- Android Studio testing workflow
- Security and privacy features