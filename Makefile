all: ios

android:
	ionic run android
	
ios:
	cordova prepare ios
	open platforms/ios/eMaster.xcodeproj

.PHONY : android ios
