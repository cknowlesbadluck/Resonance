#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

for tool in xcodegen xcodebuild ditto; do
  command -v "$tool" >/dev/null || { echo "error: $tool is required" >&2; exit 1; }
done

rm -rf build Resonance.xcodeproj
xcodegen generate --spec project.yml
xcodebuild \
  -project Resonance.xcodeproj \
  -scheme Resonance \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  clean build

app="build/DerivedData/Build/Products/Release-iphoneos/Resonance.app"
test -d "$app" || { echo "error: app bundle missing at $app" >&2; exit 1; }
mkdir -p build/Payload
cp -R "$app" build/Payload/
(
  cd build
  ditto -c -k --sequesterRsrc --keepParent Payload Resonance-unsigned.ipa
)
rm -rf build/Payload
printf 'SideStore-ready unsigned IPA: %s/ios/build/Resonance-unsigned.ipa\n' "$(cd .. && pwd)"
