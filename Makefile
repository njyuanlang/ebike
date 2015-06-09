all: android
	
android:
	ionic run android
	
ios:
	cordova prepare ios
	open platforms/ios/帮大师.xcodeproj
