# !/bin/sh

OUTPUT_APK=`grep -oe "com.extensivepro.\w\+" config.xml`
OUTPUT_APK=${OUTPUT_APK/com.extensivepro./}".apk"
echo "Build ====== "$OUTPUT_APK" ======="

cordova build --release android

cd $(dirname $0)/platforms/android/build/outputs/apk

UNSIGNED_APK=android-release-unsigned.apk
# OUTPUT_APK=emaster.apk
KEYSTORE=~/.android/yuanlang-release.keystore

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $KEYSTORE $UNSIGNED_APK yuanlang

rm $OUTPUT_APK

zipalign -v 4 $UNSIGNED_APK $OUTPUT_APK

# adb install -r ebike.apk
scp $OUTPUT_APK deploy@121.40.108.30:ebike-backend/client/.
echo "http://api.baoxu360.com/"$OUTPUT_APK
# cp ebike.apk ~/Downloads/

# ====Debug Android====
# adb logcat CordovaLog:D \*:S
# adb logcat | grep chromium
# adb logcat | grep 'Web Console'
