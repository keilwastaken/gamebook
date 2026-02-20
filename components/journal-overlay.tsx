import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import type { Game } from "@/lib/types";

export interface JournalOverlayProps {
  game: Game;
  onSave: (note: {
    whereLeftOff: string;
    quickThought?: string;
    progress: number;
  }) => void;
  onClose: () => void;
}

export function JournalOverlay({ game, onSave, onClose }: JournalOverlayProps) {
  const [progress, setProgress] = useState(game.progress ?? 0);
  const [whereLeftOff, setWhereLeftOff] = useState("");
  const [quickThought, setQuickThought] = useState("");
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const saveSlideAnim = useRef(new Animated.Value(0)).current;
  const whereInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
    ]).start(() => {
      whereInputRef.current?.focus();
    });
  }, [fadeAnim, slideAnim]);

  const handleProgressChange = (value: number) => {
    setProgress(value);
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!whereLeftOff.trim()) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.timing(saveSlideAnim, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 40,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSave({
        whereLeftOff: whereLeftOff.trim(),
        quickThought: quickThought.trim() || undefined,
        progress,
      });
    });
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 40,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const progressPercent = Math.round(progress * 100);

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      testID="journal-overlay"
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                { translateY: slideAnim },
                { translateY: saveSlideAnim },
              ],
            },
          ]}
        >
          <View style={[styles.card, CozyShadows.base]}>
            <View style={styles.handle} />

            <Text style={styles.gameTitle}>{game.title}</Text>
            <Text style={styles.sectionLabel}>JOURNEY PROGRESS</Text>

            <View style={styles.sliderRow}>
              <ProgressSlider
                value={progress}
                onValueChange={handleProgressChange}
              />
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>

            <Text style={styles.sectionLabel}>WHERE I LEFT OFF</Text>
            <TextInput
              ref={whereInputRef}
              testID="journal-where-input"
              style={styles.textInput}
              placeholder="What were you doing?"
              placeholderTextColor={palette.text.muted}
              value={whereLeftOff}
              onChangeText={setWhereLeftOff}
              multiline
              maxLength={200}
            />

            <Text style={styles.sectionLabel}>QUICK THOUGHT</Text>
            <TextInput
              testID="journal-thought-input"
              style={[styles.textInput, styles.thoughtInput]}
              placeholder="How are you feeling about this game?"
              placeholderTextColor={palette.text.muted}
              value={quickThought}
              onChangeText={setQuickThought}
              multiline
              maxLength={200}
            />

            <SaveButton
              onPress={handleSave}
              disabled={!whereLeftOff.trim() || saving}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

function ProgressSlider({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (v: number) => void;
}) {
  const trackRef = useRef<View>(null);

  const handleTouch = (pageX: number) => {
    trackRef.current?.measure((_x, _y, width, _h, px) => {
      const clamped = Math.max(0, Math.min(1, (pageX - px) / width));
      onValueChange(Math.round(clamped * 20) / 20);
    });
  };

  return (
    <View
      ref={trackRef}
      style={styles.sliderTrack}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => handleTouch(e.nativeEvent.pageX)}
      onResponderMove={(e) => handleTouch(e.nativeEvent.pageX)}
    >
      <View style={[styles.sliderFill, { width: `${value * 100}%` }]}>
        <View style={styles.sliderThumb} />
      </View>
    </View>
  );
}

function SaveButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        testID="journal-save-button"
        style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel="Save gentle note"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.saveButtonText,
            disabled && styles.saveButtonTextDisabled,
          ]}
        >
          Save Gentle Note
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(68, 88, 57, 0.4)",
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: palette.cream.DEFAULT,
    borderRadius: 24,
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.warm[300],
    alignSelf: "center",
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.text.primary,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.sage[400],
    letterSpacing: 1,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: palette.warm[200],
    borderRadius: 4,
    justifyContent: "center",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: palette.sage[400],
    borderRadius: 4,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.sage[500],
    borderWidth: 3,
    borderColor: palette.cream.DEFAULT,
    marginRight: -10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.sage[500],
    minWidth: 40,
    textAlign: "right",
  },
  textInput: {
    backgroundColor: palette.warm[50],
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Nunito",
    color: palette.text.primary,
    borderWidth: 1,
    borderColor: palette.warm[200],
    marginBottom: 16,
    minHeight: 56,
    textAlignVertical: "top",
  },
  thoughtInput: {
    minHeight: 48,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: palette.sage[500],
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: palette.sage[200],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.cream.DEFAULT,
  },
  saveButtonTextDisabled: {
    color: palette.sage[400],
  },
});
