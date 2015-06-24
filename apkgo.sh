# !/bin/sh

cd $(dirname $0)/platforms/android/ant-build/

cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore yuanlang-release.keystore CordovaApp-release-unsigned.apk yuanlang

rm ebike.apk

zipalign -v 4 CordovaApp-release-unsigned.apk ebike.apk

# adb install -r ebike.apk
# scp ebike.apk deploy@121.40.108.30:ebike-manufacturer/.