# Start development server
dev:
	npx expo start

# Start development server with cache cleared
devc:
	npx expo start --clear

# Run iOS app on simulator/device
ios:
	npx expo run:ios

# Run Android app on emulator/device
android:
	npx expo run:android

# Build Android APK for release
gradleAssemble:
	cd android && ./gradlew assembleRelease

gradleCleanAssemble:
	cd android && ./gradlew assembleRelease
	
# Build Android App Bundle for release
bundleRelease:
	cd android && ./gradlew bundleRelease

bundleCleanRelease:
	cd android && ./gradlew clean bundleRelease