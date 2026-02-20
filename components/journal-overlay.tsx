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
  }) => void;
  onClose: () => void;
  sizePresets?: Array<{ w: number; h: number }>;
  currentSize?: { w: number; h: number };
  onSelectSize?: (span: { w: number; h: number }) => void;
}

export function JournalOverlay({
  game,
  onSave,
  onClose,
  sizePresets = [],
  currentSize,
  onSelectSize,
}: JournalOverlayProps) {
  const [whereLeftOff, setWhereLeftOff] = useState("");
  const [quickThought, setQuickThought] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSizeOptions, setShowSizeOptions] = useState(false);

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

            <View style={styles.titleRow}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              {onSelectSize && sizePresets.length > 0 ? (
                <Pressable
                  testID="journal-size-button"
                  style={styles.sizeButton}
                  onPress={() => setShowSizeOptions((value) => !value)}
                >
                  <Text style={styles.sizeButtonText}>Size</Text>
                </Pressable>
              ) : null}
            </View>
            {showSizeOptions && onSelectSize && sizePresets.length > 0 ? (
              <View style={styles.sizeOptionsRow} testID="journal-size-options">
                {sizePresets.map((preset) => {
                  const selected =
                    preset.w === currentSize?.w && preset.h === currentSize?.h;
                  return (
                    <Pressable
                      key={`journal-size-${preset.w}x${preset.h}`}
                      testID={`journal-size-${preset.w}x${preset.h}`}
                      style={[
                        styles.sizeOptionButton,
                        selected && styles.sizeOptionButtonSelected,
                      ]}
                      onPress={() => {
                        onSelectSize(preset);
                        setShowSizeOptions(false);
                      }}
                    >
                      <SpanGlyph span={preset} selected={selected} />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

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

function SpanGlyph({
  span,
  selected,
}: {
  span: { w: number; h: number };
  selected: boolean;
}) {
  const cells = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const filled = col < span.w && row < span.h;
      cells.push(
        <View
          key={`glyph-${col}-${row}`}
          style={[
            styles.spanGlyphCell,
            filled && styles.spanGlyphCellFilled,
            filled && selected && styles.spanGlyphCellSelected,
          ]}
        />
      );
    }
  }
  return <View style={styles.spanGlyph}>{cells}</View>;
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
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sizeButton: {
    height: 28,
    minWidth: 56,
    borderRadius: 14,
    backgroundColor: palette.sage[50],
    borderWidth: 1,
    borderColor: palette.sage[300],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  sizeButtonText: {
    fontSize: 12,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.sage[600],
  },
  sizeOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sizeOptionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.cream.DEFAULT,
    borderWidth: 1,
    borderColor: palette.sage[200],
    alignItems: "center",
    justifyContent: "center",
  },
  sizeOptionButtonSelected: {
    borderColor: palette.sage[500],
    backgroundColor: palette.sage[50],
  },
  spanGlyph: {
    width: 18,
    height: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  spanGlyphCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: palette.sage[300],
    backgroundColor: "transparent",
  },
  spanGlyphCellFilled: {
    backgroundColor: palette.sage[300],
  },
  spanGlyphCellSelected: {
    borderColor: palette.sage[500],
    backgroundColor: palette.sage[500],
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.sage[400],
    letterSpacing: 1,
    marginBottom: 8,
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
