# !/bin/sh

cd $(dirname $0)/platforms/android/ant-build/

cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore yuanlang-release.keystore CordovaApp-release-unsigned.apk yuanlang

zipalign -v 4 CordovaApp-release-unsigned.apk ebike.apk

scp ebike.apk deploy@42.121.19.191:/home/wwwroot/app