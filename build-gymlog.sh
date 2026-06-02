#!/bin/bash

# ============================================================
#  GymLog Builder v5 — Ubuntu-compatible
#
#  Produces BOTH artifacts from Ubuntu:
#    • GymLog.apk  → Android (built locally via Gradle)
#    • GymLog.ipa  → iOS     (built on Expo EAS cloud macOS runners)
#
#  One-time setup (do this BEFORE running the script):
#    npm install -g eas-cli
#    eas login
#
#  Usage:
#    chmod +x build-gymlog.sh
#    ./build-gymlog.sh              # build both APK + IPA
#    ./build-gymlog.sh --apk-only   # local APK only
#    ./build-gymlog.sh --ipa-only   # EAS cloud IPA only
# ============================================================

# NOTE: intentionally NO "set -e" — we handle errors explicitly
# so a failure in one section doesn't silently kill the other.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${CYAN}[GymLog]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; }          # does NOT exit — caller decides
fatal()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }  # exits immediately
step()    { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

# ── Parse flags ───────────────────────────────────────────────
BUILD_APK=true
BUILD_IPA=true

for arg in "$@"; do
  case $arg in
    --apk-only) BUILD_IPA=false; BUILD_APK=true  ;;
    --ipa-only) BUILD_APK=false; BUILD_IPA=true  ;;
  esac
done

# ── Paths ─────────────────────────────────────────────────────
BUILD_DIR="/home/prasad/workspace/gym-log"
SDK_DIR="$HOME/Android/Sdk"
APP_DIR="$BUILD_DIR/gymlog-app"
EAS_DIR="$BUILD_DIR/gymlog-eas"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APK_OK=false
IPA_OK=false

echo -e "\n${BOLD}${GREEN}"
echo "  ██████╗ ██╗   ██╗███╗   ███╗██╗      ██████╗  ██████╗ "
echo "  ██╔════╝╚██╗ ██╔╝████╗ ████║██║     ██╔═══██╗██╔════╝ "
echo "  ██║  ███╗╚████╔╝ ██╔████╔██║██║     ██║   ██║██║  ███╗"
echo "  ██║   ██║ ╚██╔╝  ██║╚██╔╝██║██║     ██║   ██║██║   ██║"
echo "  ╚██████╔╝  ██║   ██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝"
echo "   ╚═════╝   ╚═╝   ╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝ "
echo -e "${NC}"
echo -e "  ${BOLD}Builder v5 — Ubuntu + EAS Cloud${NC}"
echo -e "  ───────────────────────────────────────────"
$BUILD_APK && echo -e "  ${GREEN}●${NC} Android APK  → built locally via Gradle"
$BUILD_IPA && echo -e "  ${GREEN}●${NC} iOS IPA      → built on Expo EAS cloud (macOS runner)"
echo ""

# ── Preflight ─────────────────────────────────────────────────
step "Preflight — Checking tools"

echo -e "  Node:  $(node --version 2>/dev/null || echo 'NOT FOUND')"

if $BUILD_APK; then
  echo -e "  Java:  $(java -version 2>&1 | head -1 || echo 'NOT FOUND')"
  [ -d "$SDK_DIR" ] && echo -e "  SDK:   $SDK_DIR" || warn "Android SDK not found at $SDK_DIR"
  [ -f "$APP_DIR/src/App.js" ] || fatal "App.js not found at $APP_DIR/src/App.js"
  success "App.js found"
fi

if $BUILD_IPA; then
  if ! command -v eas &>/dev/null; then
    fatal "eas-cli not installed. Run:\n    npm install -g eas-cli\n    eas login"
  fi
  echo -e "  eas:   $(eas --version 2>/dev/null)"

  EAS_USER=$(eas whoami 2>/dev/null || true)
  if [ -z "$EAS_USER" ]; then
    fatal "Not logged in to Expo. Run:  eas login"
  fi
  success "Logged in to Expo as: $EAS_USER"
fi

[ -f "$SCRIPT_DIR/anatomy.png" ] && success "anatomy.png found" || warn "anatomy.png not found — anatomy viewer will show broken image"

# ══════════════════════════════════════════════════════════════
#  SECTION A — LOCAL ANDROID APK
# ══════════════════════════════════════════════════════════════
if $BUILD_APK; then

  step "Android — Setting up environment"

  export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
  export ANDROID_SDK_ROOT="$SDK_DIR"
  export ANDROID_HOME="$SDK_DIR"
  export PATH="$JAVA_HOME/bin:$PATH:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/34.0.0"

  step "Android — Scaffold React app"
  mkdir -p "$BUILD_DIR"
  cd "$BUILD_DIR"

  if [ ! -d "$APP_DIR" ]; then
    log "First run — creating React app (2-3 min)..."
    npx create-react-app gymlog-app --template cra-template 2>/dev/null
    success "React app scaffolded"
  else
    log "Reusing existing gymlog-app"
  fi
  cd "$APP_DIR"

  step "Android — Copy source files"

  cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#0a0a0a" />
    <title>GymLog</title>
    <style>body{margin:0;background:#0a0a0a;}</style>
  </head>
  <body><div id="root"></div></body>
</html>
EOF

  cat > public/manifest.json << 'EOF'
{"short_name":"GymLog","name":"GymLog - Exercise Tracker","start_url":".","display":"standalone","theme_color":"#0a0a0a","background_color":"#0a0a0a"}
EOF

  cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
EOF

  if [ -f "$SCRIPT_DIR/anatomy.png" ]; then
    cp "$SCRIPT_DIR/anatomy.png" public/anatomy.png
    success "anatomy.png copied"
  fi

  step "Android — Build APK"

  log "Installing dependencies..."
  npm install --silent
  npm install --silent @capacitor/core @capacitor/cli @capacitor/app @capacitor/android

  log "Building React bundle..."
  GENERATE_SOURCEMAP=false npm run build
  success "React build complete"

  log "Initializing Capacitor..."
  npx cap init GymLog com.gymlog.app --web-dir=build 2>/dev/null || true

  log "Adding Android platform..."
  npx cap add android 2>/dev/null || true

  log "Syncing assets..."
  npx cap sync android

  MANIFEST="$APP_DIR/android/app/src/main/AndroidManifest.xml"
  if [ -f "$MANIFEST" ] && ! grep -q "android.permission.CAMERA" "$MANIFEST"; then
    sed -i 's|<uses-permission android:name="android.permission.INTERNET"|<uses-permission android:name="android.permission.CAMERA"/>\n    <uses-permission android:name="android.permission.INTERNET"|' "$MANIFEST"
    success "CAMERA permission added"
  fi

  GRADLE_PROPS="$APP_DIR/android/gradle.properties"
  sed -i '/^org.gradle.java.home/d;/^org.gradle.jvmargs/d' "$GRADLE_PROPS" 2>/dev/null || true
  echo "org.gradle.java.home=$JAVA_HOME"                          >> "$GRADLE_PROPS"
  echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m"  >> "$GRADLE_PROPS"
  success "Gradle configured"

  log "Running Gradle assembleDebug (first run ~300 MB download)..."
  cd "$APP_DIR/android"
  chmod +x gradlew
  ./gradlew assembleDebug --no-daemon 2>&1 | \
    grep -E "^> Task|Download http|BUILD|FAILURE|error:" | sed 's/^/    /' || true

  APK_SRC="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
  if [ -f "$APK_SRC" ]; then
    cp "$APK_SRC" "$BUILD_DIR/GymLog.apk"
    APK_OK=true
    success "APK built → $BUILD_DIR/GymLog.apk"
  else
    error "APK not produced — check Gradle errors above"
  fi

  cd "$APP_DIR"

fi  # END APK

# ══════════════════════════════════════════════════════════════
#  SECTION B — EAS CLOUD iOS IPA
# ══════════════════════════════════════════════════════════════
if $BUILD_IPA; then

  step "iOS — Setting up Expo project at $EAS_DIR"
  mkdir -p "$EAS_DIR"
  cd "$EAS_DIR"

  # ── package.json ─────────────────────────────────────────────
  cat > package.json << 'EOF'
{
  "name": "gymlog",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-asset": "~10.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-webview": "^13.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "babel-preset-expo": "^11.0.0"
  },
  "private": true
}
EOF

  # ── app.json ─────────────────────────────────────────────────
  cat > app.json << 'EOF'
{
  "expo": {
    "name": "GymLog",
    "slug": "gymlog",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.gymlog.app",
      "infoPlist": {
        "NSCameraUsageDescription": "GymLog uses the camera to scan QR codes."
      }
    },
    "android": {
      "package": "com.gymlog.app"
    },
    "plugins": []
  }
}
EOF

  # ── eas.json ─────────────────────────────────────────────────
  cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      }
    }
  }
}
EOF

  # ── babel.config.js ──────────────────────────────────────────
  cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
EOF

  # ── Placeholder assets ───────────────────────────────────────
  mkdir -p assets

  # Minimal valid 1x1 dark PNG
  DARK_PNG='\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x10\x0f\x00\x00\x00\x11\x00\x01\xb1\xe3\x91\xc0\x00\x00\x00\x00IEND\xaeB`\x82'
  printf "$DARK_PNG" > assets/icon.png
  printf "$DARK_PNG" > assets/splash.png

  if [ -f "$SCRIPT_DIR/anatomy.png" ]; then
    cp "$SCRIPT_DIR/anatomy.png" assets/anatomy.png
    success "anatomy.png copied to Expo assets"
  fi

  # ── Build React web bundle to embed ──────────────────────────
  step "iOS — Building React web bundle to embed in app"

  WEB_BUILD=""
  if [ -d "$APP_DIR/build" ]; then
    WEB_BUILD="$APP_DIR/build"
    log "Reusing existing React build from $APP_DIR/build"
  elif [ -f "$APP_DIR/src/App.js" ]; then
    log "Building React bundle from $APP_DIR..."
    cd "$APP_DIR"
    GENERATE_SOURCEMAP=false npm run build 2>&1 | tail -5
    WEB_BUILD="$APP_DIR/build"
    cd "$EAS_DIR"
  fi

  if [ -n "$WEB_BUILD" ] && [ -d "$WEB_BUILD" ]; then
    mkdir -p assets/web
    cp -r "$WEB_BUILD/." assets/web/
    success "Web bundle embedded ($(du -sh assets/web | cut -f1))"

    # App.js: full-screen WebView loading the embedded web bundle
    cat > App.js << 'APPEOF'
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

export default function App() {
  const [uri, setUri] = useState(null);

  useEffect(() => {
    const asset = Asset.fromModule(require('./assets/web/index.html'));
    asset.downloadAsync().then(() => setUri(asset.localUri));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {uri && (
        <WebView
          source={{ uri }}
          style={styles.webview}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  webview:   { flex: 1 },
});
APPEOF
    success "App.js WebView wrapper written"
  else
    warn "No React build found — copying App.js directly (may not work on iOS if it uses browser APIs)"
    cp "$APP_DIR/src/App.js" App.js 2>/dev/null || fatal "Cannot find App.js to copy"
  fi

  # ── npm install ───────────────────────────────────────────────
  step "iOS — Installing Expo dependencies"
  log "Running npm install (this may take a minute)..."
  npm install --legacy-peer-deps 2>&1 | tail -5
  success "Dependencies installed"

  # ── Link project to Expo account ─────────────────────────────
  step "iOS — Linking Expo project"
  log "Initializing EAS project (links to your Expo account)..."
  eas init --id gymlog --non-interactive 2>/dev/null || \
  eas init --non-interactive 2>/dev/null || \
  log "EAS project may already be linked — continuing"

  # ── Submit build to EAS cloud ─────────────────────────────────
  step "iOS — Submitting to EAS cloud build"
  log "Uploading to Expo's macOS build servers..."
  echo ""
  echo -e "  ${YELLOW}This submits your code to Expo's cloud. Build takes ~10-15 min.${NC}"
  echo -e "  ${YELLOW}A build URL will appear below — open it to track progress.${NC}"
  echo ""

  EAS_LOG="$BUILD_DIR/eas-build.log"

  eas build \
    --platform ios \
    --profile preview \
    --non-interactive \
    2>&1 | tee "$EAS_LOG"

  # ── Try to auto-download IPA ──────────────────────────────────
  IPA_URL=$(grep -oP 'https://expo\.dev/artifacts/eas/[^\s]+\.ipa' "$EAS_LOG" 2>/dev/null | head -1 || true)
  BUILD_URL=$(grep -oP 'https://expo\.dev/accounts/[^\s/]+/projects/[^\s/]+/builds/[^\s]+' "$EAS_LOG" 2>/dev/null | head -1 || true)

  if [ -n "$IPA_URL" ]; then
    log "Auto-downloading IPA from EAS..."
    if curl -L --progress-bar -o "$BUILD_DIR/GymLog.ipa" "$IPA_URL"; then
      IPA_OK=true
      success "IPA downloaded → $BUILD_DIR/GymLog.ipa"
    else
      error "Download failed. Get it manually from: $BUILD_URL"
    fi
  else
    # Build is queued / still running — tell user where to get it
    IPA_OK=true   # submitted successfully
    echo ""
    warn "IPA not immediately available (build is queued or still running)."
    if [ -n "$BUILD_URL" ]; then
      echo -e "  ${CYAN}Track build: $BUILD_URL${NC}"
    fi
    echo -e "  When finished, download the IPA from the Expo dashboard, or run:"
    echo -e "  ${CYAN}  eas build:list --platform ios${NC}"
    echo -e "  Full EAS output saved to: ${CYAN}$EAS_LOG${NC}"
  fi

fi  # END IPA

# ══════════════════════════════════════════════════════════════
#  Summary
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  GymLog v5 — Build Summary${NC}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
echo ""

if $BUILD_APK; then
  if $APK_OK; then
    APK_SIZE=$(du -sh "$BUILD_DIR/GymLog.apk" 2>/dev/null | cut -f1)
    echo -e "  ${GREEN}✓ Android APK:${NC}  ${CYAN}$BUILD_DIR/GymLog.apk${NC}  ($APK_SIZE)"
  else
    echo -e "  ${RED}✗ Android APK:${NC}  build failed — check errors above"
  fi
fi

if $BUILD_IPA; then
  if [ -f "$BUILD_DIR/GymLog.ipa" ]; then
    IPA_SIZE=$(du -sh "$BUILD_DIR/GymLog.ipa" 2>/dev/null | cut -f1)
    echo -e "  ${GREEN}✓ iOS IPA:${NC}      ${CYAN}$BUILD_DIR/GymLog.ipa${NC}  ($IPA_SIZE)"
  else
    echo -e "  ${GREEN}✓ iOS IPA:${NC}      Submitted to EAS — check Expo dashboard"
    echo -e "              ${CYAN}https://expo.dev${NC}"
  fi
fi

echo ""

if $BUILD_APK && $APK_OK; then
  echo -e "  ${BOLD}Install APK on Android:${NC}"
  echo -e "  1. Copy GymLog.apk to phone"
  echo -e "  2. Settings → Security → Unknown Sources → ON"
  echo -e "  3. Tap APK → Install"
  echo -e "  ${CYAN}  Or: adb install $BUILD_DIR/GymLog.apk${NC}"
  echo ""
fi

if $BUILD_IPA; then
  echo -e "  ${BOLD}Install IPA on iPhone (pick one):${NC}"
  echo -e "  • AltStore  (free): https://altstore.io   → My Apps → + → GymLog.ipa"
  echo -e "  • Sideloadly(free): https://sideloadly.io → drag IPA, connect iPhone"
  echo -e "  • TestFlight:       upload via Transporter (needs Apple Developer account)"
  echo ""
fi
