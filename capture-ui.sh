#!/bin/bash
# capture-ui.sh - Captures the current emulator/simulator screen
# Screenshots are saved to .screenshots/ (gitignored)
#
# Usage:
#   ./capture-ui.sh pre_edit      -> .screenshots/pre_edit.png
#   ./capture-ui.sh post_edit     -> .screenshots/post_edit.png
#   ./capture-ui.sh               -> .screenshots/screenshot.png

set -euo pipefail

SCREENSHOTS_DIR=".screenshots"
mkdir -p "$SCREENSHOTS_DIR"

NAME=${1:-screenshot}
FILENAME="$SCREENSHOTS_DIR/${NAME}.png"

# Check for booted iOS simulator first
if xcrun simctl list devices | grep -q "(Booted)"; then
  xcrun simctl io booted screenshot "$FILENAME"
  echo "Captured iOS Simulator to $FILENAME"
# Check for connected Android device/emulator
elif command -v adb >/dev/null 2>&1 && adb get-state >/dev/null 2>&1; then
  adb exec-out screencap -p > "$FILENAME"
  echo "Captured Android Emulator to $FILENAME"
else
  echo "Error: No booted iOS simulator or Android emulator found."
  exit 1
fi
