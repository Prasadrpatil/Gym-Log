#!/bin/bash

# ============================================================
#  GymLog KeyGen APK Builder
#
#  Folder layout expected:
#    gym-log/
#      gymlog-keygen/
#        App.js              ← the KeyGen React source
#        build-keygen.sh     ← this script
#
#  Run:
#    cd /path/to/gym-log/gymlog-keygen
#    chmod +x build-keygen.sh
#    ./build-keygen.sh
#
#  Output: gym-log/gymlog-keygen/GymLogKeyGen.apk
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${CYAN}[KeyGen]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/keygen-react"
SDK_DIR="$HOME/Android/Sdk"

echo -e "\n${BOLD}${GREEN}"
echo "  ██╗  ██╗███████╗██╗   ██╗ ██████╗ ███████╗███╗   ██╗"
echo "  ██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔════╝ ██╔════╝████╗  ██║"
echo "  █████╔╝ █████╗   ╚████╔╝ ██║  ███╗█████╗  ██╔██╗ ██║"
echo "  ██╔═██╗ ██╔══╝    ╚██╔╝  ██║   ██║██╔══╝  ██║╚██╗██║"
echo "  ██║  ██╗███████╗   ██║   ╚██████╔╝███████╗██║ ╚████║"
echo "  ╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝"
echo -e "${NC}"
echo -e "  ${BOLD}GymLog KeyGen APK Builder${NC}"
echo -e "  ───────────────────────────────────────────\n"

# ── Preflight ─────────────────────────────────────────────────
step "Preflight"
[ -f "$SCRIPT_DIR/App.js" ] || error "App.js not found in $SCRIPT_DIR"
success "App.js found"

# ── Environment ───────────────────────────────────────────────
step "Step 1/4 — Environment"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
export ANDROID_SDK_ROOT="$SDK_DIR"
export ANDROID_HOME="$SDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/34.0.0"
success "Java:  $(java -version 2>&1 | head -1)"
success "Node:  $(node --version)"

# ── React app ─────────────────────────────────────────────────
step "Step 2/4 — React app"
if [ ! -d "$APP_DIR" ]; then
  log "Creating React app (first run, 2-3 min)..."
  npx create-react-app keygen-react --template cra-template 2>/dev/null
  success "Scaffolded"
fi
cd "$APP_DIR"

# ── Copy sources ──────────────────────────────────────────────
step "Step 3/4 — Copy sources"

cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
    <meta name="theme-color" content="#0a0a0a"/>
    <title>GymLog KeyGen</title>
    <style>body{margin:0;background:#0a0a0a;}</style>
  </head>
  <body><div id="root"></div></body>
</html>
EOF

cat > public/manifest.json << 'EOF'
{"short_name":"KeyGen","name":"GymLog Key Generator","start_url":".","display":"standalone","theme_color":"#0a0a0a","background_color":"#0a0a0a"}
EOF

cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
EOF

cp "$SCRIPT_DIR/App.js" src/App.js
success "App.js copied"

# ── Build APK ─────────────────────────────────────────────────
step "Step 4/4 — Build APK"

npm install --silent
npm install --silent @capacitor/core @capacitor/cli @capacitor/android @capacitor/app

GENERATE_SOURCEMAP=false npm run build
success "React bundle built"

npx cap init GymLogKeyGen com.gymlog.keygen --web-dir=build 2>/dev/null || true
npx cap add android 2>/dev/null || true
npx cap sync android

# Patch AndroidManifest.xml — add CAMERA permission for QR scanning
MANIFEST="$APP_DIR/android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  if ! grep -q "android.permission.CAMERA" "$MANIFEST"; then
    sed -i 's|<uses-permission android:name="android.permission.INTERNET"|<uses-permission android:name="android.permission.CAMERA"/>\n    <uses-permission android:name="android.permission.INTERNET"|' "$MANIFEST"
    success "CAMERA permission added to AndroidManifest.xml"
  else
    success "CAMERA permission already present"
  fi
fi

GRADLE_PROPS="$APP_DIR/android/gradle.properties"
sed -i '/^org.gradle.java.home/d' "$GRADLE_PROPS" 2>/dev/null || true
sed -i '/^org.gradle.jvmargs/d'   "$GRADLE_PROPS" 2>/dev/null || true
echo "org.gradle.java.home=/usr/lib/jvm/java-21-openjdk-amd64" >> "$GRADLE_PROPS"
echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m"  >> "$GRADLE_PROPS"

cd "$APP_DIR/android"
chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | while IFS= read -r line; do
  echo "$line" | grep -qE "^> Task|BUILD|FAILURE|error:" && echo "    $line" || true
done

APK="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  cp "$APK" "$SCRIPT_DIR/GymLogKeyGen.apk"
  SIZE=$(du -sh "$SCRIPT_DIR/GymLogKeyGen.apk" | cut -f1)
  echo ""
  echo -e "${BOLD}${GREEN}══════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✓  BUILD SUCCESSFUL${NC}"
  echo -e "${BOLD}${GREEN}══════════════════════════════════════${NC}"
  echo ""
  echo -e "  APK: ${CYAN}$SCRIPT_DIR/GymLogKeyGen.apk${NC}  ($SIZE)"
  echo ""
  echo -e "  ${BOLD}Install:${NC}  adb install $SCRIPT_DIR/GymLogKeyGen.apk"
  echo ""
else
  ./gradlew assembleDebug --no-daemon --stacktrace 2>&1 | tail -60
  error "Build failed — see above"
fi
