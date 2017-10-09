all: ios

android:
	ionic cordova run android

ios:
	cordova prepare ios
	open platforms/ios/eMaster.xcodeproj

.PHONY : android ios
