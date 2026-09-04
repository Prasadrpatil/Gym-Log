#!/bin/bash

# ============================================================
#  GymLog APK Builder v3
#  Builds the APK directly from this repo's gymlog-app/ — no
#  separate scaffolded copy. Run after editing any file under
#  gymlog-app/src/.
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

SDK_DIR="$HOME/Android/Sdk"

# Resolve the directory where this script lives — the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/gymlog-app"

echo -e "\n${BOLD}${GREEN}"
echo "  ██████╗ ██╗   ██╗███╗   ███╗██╗      ██████╗  ██████╗ "
echo "  ██╔════╝╚██╗ ██╔╝████╗ ████║██║     ██╔═══██╗██╔════╝ "
echo "  ██║  ███╗╚████╔╝ ██╔████╔██║██║     ██║   ██║██║  ███╗"
echo "  ██║   ██║ ╚██╔╝  ██║╚██╔╝██║██║     ██║   ██║██║   ██║"
echo "  ╚██████╔╝  ██║   ██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝"
echo "   ╚═════╝   ╚═╝   ╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝ "
echo -e "${NC}"
echo -e "  ${BOLD}APK Builder v3${NC}"
echo -e "  ───────────────────────────────────────────\n"

# ── Preflight checks ─────────────────────────────────────────
step "Preflight — Checking required files"

[ -f "$APP_DIR/src/App.js" ]        || error "App.js not found (expected: $APP_DIR/src/App.js)"
[ -f "$APP_DIR/public/anatomy.png" ] || error "anatomy.png not found (expected: $APP_DIR/public/anatomy.png)"
[ -f "$APP_DIR/package.json" ]       || error "package.json not found — is gymlog-app/ a valid CRA project?"
[ -d "$SDK_DIR/cmdline-tools" ]       || error "Android SDK not found at $SDK_DIR (expected cmdline-tools/ inside it)"

success "App source found at $APP_DIR/src/"
success "anatomy.png found"
success "Android SDK found at $SDK_DIR"

# ── Environment setup ─────────────────────────────────────────
step "Step 1/4 — Setting up environment"

# Prefer nvm's Node if present (user-space install) — leaves a system Node
# on PATH untouched on machines that don't have nvm.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use default >/dev/null 2>&1

# Prefer the system JDK 21 if installed there; fall back to a user-space one.
if [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
  export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
elif [ -d "$HOME/.jdks/jdk-21" ]; then
  export JAVA_HOME="$HOME/.jdks/jdk-21"
else
  error "No JDK 21 found (checked /usr/lib/jvm/java-21-openjdk-amd64 and ~/.jdks/jdk-21)"
fi
export ANDROID_SDK_ROOT="$SDK_DIR"
export ANDROID_HOME="$SDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/34.0.0"

command -v node >/dev/null || error "node not found on PATH (no system Node and no ~/.nvm install)"

success "Java:  $(java -version 2>&1 | head -1)"
success "Node:  $(node --version)"
success "SDK:   $SDK_DIR"

cd "$APP_DIR"
success "Building from $APP_DIR (the repo copy — no scaffolded duplicate)"

# ── Install deps & Capacitor ────────────────────────────────
step "Step 2/4 — Installing dependencies"

log "Installing npm dependencies..."
npm install --silent

log "Installing Capacitor..."
npm install --silent @capacitor/core @capacitor/cli @capacitor/android @capacitor/app

# ── Build & sync ─────────────────────────────────────────────
step "Step 3/4 — Building React + syncing Capacitor"

log "Building production bundle..."
GENERATE_SOURCEMAP=false npm run build
success "React build complete"

log "Adding Android platform..."
npx cap add android 2>/dev/null || true

log "Syncing assets to Android..."
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

# Configure gradle for Java 21
GRADLE_PROPS="$APP_DIR/android/gradle.properties"
sed -i '/^org.gradle.java.home/d' "$GRADLE_PROPS" 2>/dev/null || true
sed -i '/^org.gradle.jvmargs/d'   "$GRADLE_PROPS" 2>/dev/null || true
echo "org.gradle.java.home=$JAVA_HOME" >> "$GRADLE_PROPS"
echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m"  >> "$GRADLE_PROPS"
success "Gradle configured for Java 21 ($JAVA_HOME)"

# ── APK ──────────────────────────────────────────────────────
step "Step 4/4 — Building APK"

log "Building APK — first run downloads ~300MB, please wait..."
cd "$APP_DIR/android"
chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1 | while IFS= read -r line; do
  echo "$line" | grep -qE "^> Task|Download http|BUILD|FAILURE|error:" && echo "    $line" || true
done

APK_SRC="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
APK_OUT="$SCRIPT_DIR/GymLog.apk"

if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$APK_OUT"
  APK_SIZE=$(du -sh "$APK_OUT" | cut -f1)

  echo ""
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✓  BUILD SUCCESSFUL — GymLog${NC}"
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  APK: ${CYAN}$APK_OUT${NC}  (${APK_SIZE})"
  echo ""
  echo -e "  ${BOLD}Install on Android:${NC}"
  echo -e "  1. Copy GymLog.apk to your phone"
  echo -e "  2. Settings → Security → Unknown Sources → ON"
  echo -e "  3. Tap APK file → Install"
  echo -e "  ${CYAN}  Or via USB: adb install $APK_OUT${NC}"
  echo ""
else
  echo ""
  echo -e "${RED}Build failed. Running with full output for diagnosis:${NC}"
  ./gradlew assembleDebug --no-daemon --stacktrace 2>&1 | tail -80
  error "See errors above."
fi
