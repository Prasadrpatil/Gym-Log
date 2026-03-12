#!/bin/bash

# ============================================================
#  GymLog APK Builder v2
#  Prerequisites: Place these files next to this script:
#    - App.js          → your React app component
#    - anatomy.png     → anatomy image for the viewer
#
#  Run with: chmod +x build-gymlog.sh && ./build-gymlog.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${CYAN}[GymLog]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

BUILD_DIR="/home/prasad/workspace/gym-log"
SDK_DIR="$HOME/Android/Sdk"
APP_DIR="$BUILD_DIR/gymlog-app"

# Resolve the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\n${BOLD}${GREEN}"
echo "  ██████╗ ██╗   ██╗███╗   ███╗██╗      ██████╗  ██████╗ "
echo "  ██╔════╝╚██╗ ██╔╝████╗ ████║██║     ██╔═══██╗██╔════╝ "
echo "  ██║  ███╗╚████╔╝ ██╔████╔██║██║     ██║   ██║██║  ███╗"
echo "  ██║   ██║ ╚██╔╝  ██║╚██╔╝██║██║     ██║   ██║██║   ██║"
echo "  ╚██████╔╝  ██║   ██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝"
echo "   ╚═════╝   ╚═╝   ╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝ "
echo -e "${NC}"
echo -e "  ${BOLD}APK Builder v2${NC}"
echo -e "  ───────────────────────────────────────────\n"

# ── Preflight checks ─────────────────────────────────────────
step "Preflight — Checking required files"

[ -f "$APP_DIR/src/App.js" ] || error "App.js not found (expected: $APP_DIR/src/App.js)"
[ -f "$SCRIPT_DIR/anatomy.png" ] || warn "anatomy.png not found — the anatomy viewer will show a broken image"

success "App.js found at $APP_DIR/src/App.js"
[ -f "$SCRIPT_DIR/anatomy.png" ] && success "anatomy.png found"

# ── Environment setup ─────────────────────────────────────────
step "Step 1/4 — Setting up environment"

export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
export ANDROID_SDK_ROOT="$SDK_DIR"
export ANDROID_HOME="$SDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/34.0.0"

success "Java:  $(java -version 2>&1 | head -1)"
success "Node:  $(node --version)"
success "SDK:   $SDK_DIR"

# ── Create or reuse React app ─────────────────────────────────
step "Step 2/4 — Setting up gymlog-app"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

if [ -d "$APP_DIR" ]; then
  log "Found existing gymlog-app, skipping create-react-app..."
else
  log "First run — creating React app (2-3 minutes)..."
  npx create-react-app gymlog-app --template cra-template 2>/dev/null
  success "React app scaffolded"
fi

cd "$APP_DIR"
success "Using gymlog-app at $APP_DIR"

# ── Copy source files ─────────────────────────────────────────
step "Step 3/4 — Copying GymLog source files"

log "Writing public/index.html..."
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

log "Writing public/manifest.json..."
cat > public/manifest.json << 'EOF'
{"short_name":"GymLog","name":"GymLog - Exercise Tracker","start_url":".","display":"standalone","theme_color":"#0a0a0a","background_color":"#0a0a0a"}
EOF

log "Writing src/index.js..."
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
EOF

log "App.js already in place at src/App.js — skipping copy"

log "Copying anatomy.png to public/..."
if [ -f "$SCRIPT_DIR/anatomy.png" ]; then
  cp "$SCRIPT_DIR/anatomy.png" public/anatomy.png
  success "anatomy.png copied to public/"
else
  warn "Skipping anatomy.png — file not found"
fi

# ── Build & APK ──────────────────────────────────────────────
step "Step 4/4 — Building React + Android APK"

log "Installing npm dependencies..."
npm install --silent

log "Installing Capacitor..."
npm install --silent @capacitor/core @capacitor/cli @capacitor/android @capacitor/app

log "Building production bundle..."
GENERATE_SOURCEMAP=false npm run build
success "React build complete"

# Capacitor setup
log "Initializing Capacitor..."
npx cap init GymLog com.gymlog.app --web-dir=build 2>/dev/null || true

log "Adding Android platform..."
npx cap add android 2>/dev/null || true

log "Syncing assets to Android..."
npx cap sync android

# Configure gradle for Java 21
GRADLE_PROPS="$APP_DIR/android/gradle.properties"
sed -i '/^org.gradle.java.home/d' "$GRADLE_PROPS" 2>/dev/null || true
sed -i '/^org.gradle.jvmargs/d'   "$GRADLE_PROPS" 2>/dev/null || true
echo "org.gradle.java.home=/usr/lib/jvm/java-21-openjdk-amd64" >> "$GRADLE_PROPS"
echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m"  >> "$GRADLE_PROPS"
success "Gradle configured for Java 21"

log "Building APK — first run downloads ~300MB, please wait..."
cd "$APP_DIR/android"
chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | while IFS= read -r line; do
  echo "$line" | grep -qE "^> Task|Download http|BUILD|FAILURE|error:" && echo "    $line" || true
done

APK_SRC="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$BUILD_DIR/GymLog.apk"
  APK_SIZE=$(du -sh "$BUILD_DIR/GymLog.apk" | cut -f1)

  echo ""
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✓  BUILD SUCCESSFUL — GymLog v2${NC}"
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  APK: ${CYAN}$BUILD_DIR/GymLog.apk${NC}  (${APK_SIZE})"
  echo ""
  echo -e "  ${BOLD}What's new in v2:${NC}"
  echo -e "  · Hardware back button no longer exits the app"
  echo -e "  · Anatomy back button returns to home screen"
  echo -e "  · Sessions always sorted newest-first by date"
  echo -e "  · Exercises sorted by most recently used"
  echo -e "  · Anatomical SVG muscle icons on home screen"
  echo -e "  · 140+ exercises pre-populated across 7 muscles"
  echo ""
  echo -e "  ${BOLD}Install on Android:${NC}"
  echo -e "  1. Copy GymLog.apk to your phone"
  echo -e "  2. Settings → Security → Unknown Sources → ON"
  echo -e "  3. Tap APK file → Install"
  echo -e "  ${CYAN}  Or via USB: adb install $BUILD_DIR/GymLog.apk${NC}"
  echo ""
else
  echo ""
  echo -e "${RED}Build failed. Running with full output for diagnosis:${NC}"
  ./gradlew assembleDebug --no-daemon --stacktrace 2>&1 | tail -80
  error "See errors above."
fi