# Android Development Environment Setup Guide

## 🚀 Quick Setup Steps

### 1. Install Android Studio
```bash
# Download Android Studio (macOS)
curl -O https://redirector.gvt1.com/edgedl/android/studio/install/2023.1.1.28/android-studio-2023.1.1.28-mac.dmg

# Or download manually from: https://developer.android.com/studio
```

### 2. Install Required Components

Once Android Studio is installed:

#### A. SDK Platforms
- ✅ **Android 14.0 (API 34)** - Target SDK
- ✅ **Android 13.0 (API 33)** - Recommended
- ✅ **Android 12.0 (API 31)** - Minimum support

#### B. SDK Tools
- ✅ **Android SDK Build-Tools 34.0.0**
- ✅ **Android SDK Command-line Tools**
- ✅ **Android SDK Platform-Tools**
- ✅ **Google Play services**
- ✅ **Android Emulator**
- ✅ **Google APIs Intel x86 Atom_64 System Image**

### 3. JDK Setup (Java 17)

#### Option A: Use Android Studio's Bundled JDK
```bash
# Add to ~/.zshrc or ~/.bash_profile
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH
```

#### Option B: Install via Homebrew (macOS)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install JDK 17
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
echo 'export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"' >> ~/.zshrc
```

#### Option C: Manual Download
1. Download from: https://www.oracle.com/java/technologies/downloads/
2. Install JDK 17
3. Set JAVA_HOME environment variable

### 4. Environment Variables
Add to your shell profile (~/.zshrc for macOS, ~/.bash_profile for Linux):

```bash
# Java
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/emulator:$PATH

# Gradle
export GRADLE_HOME="$HOME/.gradle"
export PATH=$GRADLE/bin:$PATH
```

### 5. Verify Installation

```bash
# Reload shell
source ~/.zshrc

# Check versions
java -version                    # Should show Java 17
javac -version                   # Should show Java 17
echo $ANDROID_HOME               # Should show SDK path
./gradlew --version             # Should show Gradle 8.1.4
```

## 🔧 Update Commands

### Update Android Studio
1. Open Android Studio
2. **Help > Check for Updates...**
3. Install any available updates

### Update SDK Components via GUI
1. **Tools > SDK Manager**
2. **SDK Platforms Tab**: Select and install Android 14 (API 34)
3. **SDK Tools Tab**: Select and install Build Tools 34.0.0

### Update SDK via Command Line
```bash
# Navigate to SDK tools
cd ~/Library/Android/sdk/tools/bin

# Update SDK manager
./sdkmanager --update

# Install components
./sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

## 📱 Create Virtual Device (AVD)

### Using Android Studio GUI:
1. **Tools > AVD Manager**
2. **Create Virtual Device**
3. Choose hardware:
   - **Pixel 6 Pro** (Recommended)
   - **RAM**: 4096 MB
   - **Internal Storage**: 8000 MB
   - **Graphics**: Hardware - GLES 2.0
4. Select system image:
   - **Android 14.0 (API 34)**
   - **Google APIs Intel x86 Atom_64**
5. Finish and launch

### Using Command Line:
```bash
# Create AVD
$ANDROID_HOME/tools/bin/avdmanager create avd \
  -n "Pixel_6_Pro_API_34" \
  -k "system-images;android-34;google_apis;x86_64" \
  -d "pixel_6_pro"

# Launch emulator
$ANDROID_HOME/emulator/emulator -avd "Pixel_6_Pro_API_34"
```

## 🧪 Test the Setup

### 1. Clone and Build Parental Control App
```bash
cd /workspace/cmhxn2o2f00slpsim6r3u5oqj/ParentalApp

# Build parent app
cd parent-app
./gradlew clean build

# Build child app
cd ../child-app
./gradlew clean build
```

### 2. Run Tests
```bash
# Run comprehensive test suite
./comprehensive_test.sh

# Run Android tests
cd parent-app && ./gradlew testDebugUnitTest
cd ../child-app && ./gradlew testDebugUnitTest
```

### 3. Install and Run on Emulator
```bash
# Install parent app
cd parent-app
./gradlew installDebug

# Install child app
cd ../child-app
./gradlew installDebug

# Launch apps
adb shell am start -n com.parentalcontrol.parent/.MainActivity
adb shell am start -n com.parentalcontrol.child/.MainActivity
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "SDK not found" Error
```bash
# Set ANDROID_HOME
export ANDROID_HOME="$HOME/Library/Android/sdk"
echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
```

#### 2. "JAVA_HOME not set" Error
```bash
# Find Java installation
/usr/libexec/java_home -V

# Set JAVA_HOME (choose JDK 17 or higher)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### 3. Gradle Build Failures
```bash
# Clean and rebuild
./gradlew clean
./gradlew build

# Clear Gradle cache
./gradlew --stop
rm -rf ~/.gradle/caches
```

#### 4. Emulator Issues
```bash
# Cold boot emulator
# AVD Manager > Select AVD > Cold Boot Now

# Reset ADB
adb kill-server
adb start-server
```

#### 5. Permission Issues (macOS)
```bash
# Allow Android Studio permissions
sudo xattr -rd com.apple.quarantine "/Applications/Android Studio.app"
```

## 📚 Additional Resources

- [Android Studio Official Download](https://developer.android.com/studio)
- [Android SDK Documentation](https://developer.android.com/studio/intro/update.html)
- [JDK 17 Download](https://www.oracle.com/java/technologies/downloads/)
- [Parental Control App Documentation](./README.md)

## 🎯 Minimum Requirements for Parental Control App

- **Android Studio**: Hedgehog 2023.1.1 or later
- **JDK**: 17 or later
- **Android SDK**: API 34 (Android 14)
- **Build Tools**: 34.0.0
- **Gradle**: 8.1.4
- **RAM**: 8GB recommended (for emulator)
- **Storage**: 10GB free space

Once you have completed these steps, your development environment will be ready to build and test the parental control app!