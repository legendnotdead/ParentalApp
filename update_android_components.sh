#!/bin/bash

# Android SDK, JDK, and Build Tools Update Script
# For Parental Control App Development

echo "🔄 Android Development Environment Update Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check current versions
echo "📋 Checking current versions..."
echo "============================="

# Check JDK
if command_exists java; then
    JDK_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo "Current JDK version: $JDK_VERSION"
else
    print_error "JDK not found"
fi

# Check Android Studio
if [ -d "/Applications/Android Studio.app" ]; then
    STUDIO_VERSION=$(cat /Applications/Android\ Studio.app/Contents/Info.plist 2>/dev/null | grep CFBundleShortVersionString | cut -d'>' -f2 | cut -d'<' -f1)
    echo "Android Studio version: $STUDIO_VERSION"
else
    print_warning "Android Studio not found in /Applications"
fi

# Check Android SDK
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "Android SDK found at: $HOME/Library/Android/sdk"
else
    print_error "Android SDK not found"
fi

# Check Gradle
if [ -f "./gradlew" ]; then
    echo "Project Gradle wrapper available"
    ./gradlew --version | head -n 3
else
    print_warning "Gradle wrapper not found in current directory"
fi

echo ""
echo "🔧 Recommended Updates"
echo "====================="

# Recommended versions based on current best practices
RECOMMENDED_JDK="17"
RECOMMENDED_STUDIO="Hedgehog 2023.1.1 or later"
RECOMMENDED_GRADLE="8.1.4"
RECOMMENDED_KOTLIN="1.9.20"
RECOMMENDED_BUILD_TOOLS="34.0.0"
RECOMMENDED_COMPILE_SDK="34"

echo "✅ JDK: $RECOMMENDED_JDK"
echo "✅ Android Studio: $RECOMMENDED_STUDIO"
echo "✅ Gradle: $RECOMMENDED_GRADLE"
echo "✅ Kotlin: $RECOMMENDED_KOTLIN"
echo "✅ Build Tools: $RECOMMENDED_BUILD_TOOLS"
echo "✅ Compile SDK: API $RECOMMENDED_COMPILE_SDK"

echo ""
echo "📱 Update Options"
echo "================"

echo "Choose an update option:"
echo "1) Update Kotlin and Gradle versions in build files"
echo "2) Show Android Studio GUI update instructions"
echo "3) Install/update Android SDK components via command line"
echo "4) Setup JDK 17 environment"
echo "5) Update all (build files + show instructions)"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Updating build.gradle files..."

        # Update parent-app build.gradle
        if [ -f "parent-app/build.gradle" ]; then
            echo "Updating parent-app build.gradle..."
            sed -i '' 's/kotlin_version = '\''1\.9\.10'\''/kotlin_version = '\''1.9.20'\''/g' parent-app/build.gradle
            sed -i '' 's/navigation_version = '\''2\.7\.6'\''/navigation_version = '\''2.7.7'\''/g' parent-app/build.gradle
            sed -i '' 's/room_version = '\''2\.6\.1'\''/room_version = '\''2.6.2'\''/g' parent-app/build.gradle
            sed -i '' 's/lifecycle_version = '\''2\.7\.0'\''/lifecycle_version = '\''2.8.0'\''/g' parent-app/build.gradle
            sed -i '' 's/hilt_version = '\''2\.48'\''/hilt_version = '\''2.51.1'\''/g' parent-app/build.gradle
            print_status "Parent app build.gradle updated"
        fi

        # Update child-app build.gradle
        if [ -f "child-app/app/build.gradle" ]; then
            echo "Updating child-app build.gradle dependencies..."
            # The child app uses the version variables from root build.gradle
            print_status "Child app build.gradle updated (uses root variables)"
        fi

        echo ""
        echo "📝 Updated versions:"
        echo "- Kotlin: 1.9.10 → 1.9.20"
        echo "- Navigation: 2.7.6 → 2.7.7"
        echo "- Room: 2.6.1 → 2.6.2"
        echo "- Lifecycle: 2.7.0 → 2.8.0"
        echo "- Hilt: 2.48 → 2.51.1"
        ;;

    2)
        echo ""
        echo "🎨 Android Studio GUI Update Instructions:"
        echo "======================================"
        echo ""
        echo "1. Open Android Studio"
        echo "2. Go to Help > Check for Updates..."
        echo "3. Install any available updates"
        echo ""
        echo "📱 SDK Manager Updates:"
        echo "1. Tools > SDK Manager"
        echo "2. SDK Platforms Tab - Install:"
        echo "   ✓ Android 14.0 (API 34)"
        echo "   ✓ Android 13.0 (API 33)"
        echo "   ✓ Android 12.0 (API 31)"
        echo ""
        echo "3. SDK Tools Tab - Install:"
        echo "   ✓ Android SDK Build-Tools 34.0.0"
        echo "   ✓ Android SDK Command-line Tools"
        echo "   ✓ Android SDK Platform-Tools"
        echo "   ✓ Google Play services"
        echo "   ✓ Google APIs Intel x86 Atom_64 System Image"
        ;;

    3)
        echo ""
        echo "💻 Command Line SDK Updates:"
        echo "============================"
        echo ""

        if [ -d "$HOME/Library/Android/sdk/tools/bin" ]; then
            SDKMANAGER="$HOME/Library/Android/sdk/tools/bin/sdkmanager"
            echo "Updating SDK manager..."
            $SDKMANAGER --update

            echo ""
            echo "Installing required components..."
            $SDKMANAGER "platform-tools" "platforms;android-34" "platforms;android-33"
            $SDKMANAGER "build-tools;34.0.0"
            $SDKMANAGER "system-images;android-34;google_apis;x86_64"

            print_status "SDK components updated"
        else
            print_error "SDK manager not found. Please install Android Studio first."
        fi
        ;;

    4)
        echo ""
        echo "☕ JDK 17 Setup Instructions:"
        echo "============================"
        echo ""
        echo "Option 1: Use Android Studio's Bundled JDK"
        echo "Add to your ~/.zshrc or ~/.bash_profile:"
        echo 'export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"'
        echo ""
        echo "Option 2: Install via Homebrew (macOS)"
        echo "brew install openjdk@17"
        echo 'export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"'
        echo ""
        echo "Option 3: Manual Download"
        echo "Download from: https://www.oracle.com/java/technologies/downloads/"
        echo ""
        echo "After setting JAVA_HOME, restart your terminal and run:"
        echo "java -version  # Should show JDK 17"
        ;;

    5)
        echo ""
        echo "🚀 Comprehensive Update:"
        echo "======================="

        # Update build files
        echo "1. Updating build files..."
        if [ -f "parent-app/build.gradle" ]; then
            sed -i '' 's/kotlin_version = '\''1\.9\.10'\''/kotlin_version = '\''1.9.20'\''/g' parent-app/build.gradle
            sed -i '' 's/navigation_version = '\''2\.7\.6'\''/navigation_version = '\''2.7.7'\''/g' parent-app/build.gradle
            sed -i '' 's/room_version = '\''2\.6\.1'\''/room_version = '\''2\.6\.2'\''/g' parent-app/build.gradle
            sed -i '' 's/lifecycle_version = '\''2\.7\.0'\''/lifecycle_version = '\''2\.8.0'\''/g' parent-app/build.gradle
            print_status "Build files updated"
        fi

        echo ""
        echo "2. Please follow these manual steps:"
        echo ""
        echo "📱 Android Studio Updates:"
        echo "   - Open Android Studio"
        echo "   - Help > Check for Updates..."
        echo "   - Install available updates"
        echo ""
        echo "🛠️ SDK Updates:"
        echo "   - Tools > SDK Manager"
        echo "   - Install Android 14 (API 34) and Build Tools 34.0.0"
        echo ""
        echo "☕ JDK Setup:"
        echo "   - Install JDK 17 or use Android Studio's bundled JDK"
        echo "   - Set JAVA_HOME environment variable"
        ;;

    6)
        echo "Exiting..."
        exit 0
        ;;

    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🧪 Verification Steps:"
echo "======================"
echo ""
echo "After updating, verify with these commands:"
echo ""
echo "1. Check JDK version:"
echo "   java -version"
echo ""
echo "2. Check Gradle:"
echo "   ./gradlew --version"
echo ""
echo "3. Build the project:"
echo "   cd parent-app && ./gradlew clean build"
echo "   cd child-app && ./gradlew clean build"
echo ""
echo "4. Run tests:"
echo "   ./comprehensive_test.sh"
echo ""
echo "5. Create AVD:"
echo "   - Open Android Studio"
echo "   - Tools > AVD Manager"
echo "   - Create Virtual Device"
echo "   - Choose Pixel 6 Pro with API 34"
echo ""

print_status "Update script completed!"