#!/bin/bash
# capture-ui.sh - Captures the current emulator/simulator screen

set -euo pipefail

FILENAME="${1:-screenshot.png}"

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
