dev:
	npx expo start

devc:
	npx expo start --clear

ios:
	npx expo run:ios

android:
	npx expo run:android

gradleAssemble:
	cd android && ./gradlew assembleRelease