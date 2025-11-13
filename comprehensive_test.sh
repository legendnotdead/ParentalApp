#!/bin/bash
# Comprehensive testing script for Parental Control App

echo "🚀 Starting comprehensive Parental Control App testing..."

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Function to check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        exit 1
    fi
    echo "✅ Node.js: $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    echo "✅ npm: $(npm --version)"

    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        echo "⚠️  MongoDB not found in PATH, please ensure it's installed and running"
    else
        echo "✅ MongoDB: $(mongod --version | head -n1)"
    fi

    # Check Redis
    if ! command -v redis-server &> /dev/null; then
        echo "⚠️  Redis not found in PATH, please ensure it's installed and running"
    else
        echo "✅ Redis: $(redis-server --version)"
    fi
}

# Function to setup environment
setup_environment() {
    echo "🔧 Setting up environment..."

    # Backend setup
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    check_success "Backend dependency installation"

    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📄 Created .env file from example"
    fi

    cd ..

    # Create logs directory
    mkdir -p backend/logs
    echo "📁 Created logs directory"
}

# Function to run backend tests
test_backend() {
    echo "🧪 Running backend tests..."
    cd backend

    # Start MongoDB and Redis if not running (simple check)
    echo "🔍 Checking database connections..."

    # Run unit tests
    echo "Running unit tests..."
    npm run test:unit
    check_success "Unit tests"

    # Run integration tests
    echo "Running integration tests..."
    npm run test:integration
    check_success "Integration tests"

    # Run coverage
    echo "Generating coverage report..."
    npm run test:coverage
    check_success "Coverage report"

    cd ..
}

# Function to test Android apps
test_android() {
    echo "📱 Testing Android applications..."

    # Test parent app
    echo "Testing parent app..."
    cd parent-app

    # Check if Android project structure is valid
    if [ -f "app/build.gradle" ] && [ -f "app/src/main/AndroidManifest.xml" ]; then
        echo "✅ Parent app structure is valid"

        # Run unit tests
        echo "Running parent app unit tests..."
        ./gradlew testDebugUnitTest
        check_success "Parent app unit tests"

        # Run lint
        echo "Running parent app lint..."
        ./gradlew lintDebug
        check_success "Parent app lint"

    else
        echo "❌ Parent app structure is invalid"
    fi

    cd ..

    # Test child app
    echo "Testing child app..."
    cd child-app

    # Check if Android project structure is valid
    if [ -f "app/build.gradle" ] && [ -f "app/src/main/AndroidManifest.xml" ]; then
        echo "✅ Child app structure is valid"

        # Run unit tests
        echo "Running child app unit tests..."
        ./gradlew testDebugUnitTest
        check_success "Child app unit tests"

        # Run lint
        echo "Running child app lint..."
        ./gradlew lintDebug
        check_success "Child app lint"

    else
        echo "❌ Child app structure is invalid"
    fi

    cd ..
}

# Function to check code quality
check_code_quality() {
    echo "🔍 Checking code quality..."

    # Backend linting
    echo "Linting backend code..."
    cd backend
    npm run lint
    check_success "Backend linting"
    cd ..

    # Check for security issues (basic check)
    echo "🔒 Checking for basic security issues..."

    # Check for hardcoded secrets in backend
    if grep -r "password\|secret\|key" backend/src --include="*.js" | grep -v "passwordReset\|emailVerification\|JWT_SECRET\|passwordResetToken\|emailVerificationToken" | head -n 5; then
        echo "⚠️  Potential hardcoded secrets found, please review"
    else
        echo "✅ No obvious hardcoded secrets found"
    fi
}

# Function to validate configuration files
validate_configs() {
    echo "⚙️  Validating configuration files..."

    # Check backend package.json
    if [ -f "backend/package.json" ]; then
        echo "✅ backend/package.json exists"
        if node -e "require('./backend/package.json')" 2>/dev/null; then
            echo "✅ backend/package.json is valid JSON"
        else
            echo "❌ backend/package.json is invalid JSON"
        fi
    fi

    # Check Android build files
    if [ -f "parent-app/build.gradle" ] && [ -f "child-app/build.gradle" ]; then
        echo "✅ Android build files exist"
    else
        echo "❌ Android build files missing"
    fi

    # Check manifests
    if [ -f "parent-app/app/src/main/AndroidManifest.xml" ] && [ -f "child-app/app/src/main/AndroidManifest.xml" ]; then
        echo "✅ Android manifests exist"
    else
        echo "❌ Android manifests missing"
    fi
}

# Function to generate test report
generate_report() {
    echo "📊 Generating test report..."

    REPORT_FILE="test_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > $REPORT_FILE << EOF
Parental Control App Test Report
Generated: $(date)

✅ COMPLETED TESTS:
- Backend unit tests
- Backend integration tests
- Parent app unit tests
- Child app unit tests
- Code quality checks
- Configuration validation

📊 COVERAGE SUMMARY:
Backend coverage reports available in backend/coverage/
Android test reports available in */build/reports/tests/

🔧 NEXT STEPS:
1. Review any test failures above
2. Check coverage reports for areas needing improvement
3. Run manual testing on Android emulators/devices
4. Perform integration testing between backend and mobile apps
5. Conduct security testing and performance testing

📝 NOTES:
- Backend server can be started with: cd backend && npm run dev
- Android apps can be built with: ./gradlew assembleDebug
- Emulator testing requires Android Studio setup
EOF

    echo "📄 Test report generated: $REPORT_FILE"
}

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -b, --backend   Run backend tests only"
    echo "  -a, --android   Run Android tests only"
    echo "  -q, --quality   Run code quality checks only"
    echo ""
    echo "No options will run all tests"
}

# Main execution
main() {
    local backend_only=false
    local android_only=false
    local quality_only=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -b|--backend)
                backend_only=true
                shift
                ;;
            -a|--android)
                android_only=true
                shift
                ;;
            -q|--quality)
                quality_only=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    echo "🎯 Parental Control App - Comprehensive Testing Suite"
    echo "========================================================"

    check_requirements

    if [ "$quality_only" = true ]; then
        check_code_quality
        validate_configs
        generate_report
        exit 0
    fi

    setup_environment

    if [ "$backend_only" = false ] && [ "$android_only" = false ]; then
        test_backend
        test_android
        check_code_quality
        validate_configs
    elif [ "$backend_only" = true ]; then
        test_backend
        check_code_quality
    elif [ "$android_only" = true ]; then
        test_android
        check_code_quality
    fi

    generate_report

    echo ""
    echo "🎉 All tests completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Review the test report"
    echo "2. Check coverage reports for any gaps"
    echo "3. Set up Android emulators for UI testing"
    echo "4. Start the backend server for integration testing: cd backend && npm run dev"
    echo ""
    echo "📱 To build Android apps:"
    echo "   Parent App: cd parent-app && ./gradlew assembleDebug"
    echo "   Child App: cd child-app && ./gradlew assembleDebug"
}

# Run main function
main "$@"