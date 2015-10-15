# !/bin/sh

cordova build --release android

cd $(dirname $0)/platforms/android/build/outputs/apk

UNSIGNED_APK=android-release-unsigned.apk
OUTPUT_APK=ebike.apk
KEYSTORE=~/.android/yuanlang-release.keystore

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $KEYSTORE $UNSIGNED_APK yuanlang

rm ebike.apk

zipalign -v 4 $UNSIGNED_APK $OUTPUT_APK

adb install -r ebike.apk
# scp ebike.apk deploy@121.40.108.30:ebike-manufacturer/.

# ====Debug Android====
# adb logcat CordovaLog:D \*:S
# adb logcat | grep chromise