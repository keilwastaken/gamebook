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
import {
  GRID_ACTIVE_FULL_GRID,
  GRID_ACTIVE_LEFT_COLUMN,
  GRID_ACTIVE_TOP_LEFT,
  GRID_ACTIVE_TOP_ROW,
  GridGlyph,
  type GridCellPosition,
} from "@/components/ui/grid-glyph";
import { CozyShadows } from "@/utils/shadows";
import type { Game } from "@/lib/types";

export interface JournalSizePreset {
  id?: string;
  w: number;
  h: number;
  activePositions?: readonly GridCellPosition[];
}

export interface JournalOverlayProps {
  game: Game;
  onSave: (note: {
    whereLeftOff: string;
    quickThought?: string;
  }) => void;
  onClose: () => void;
  sizePresets?: JournalSizePreset[];
  currentSize?: { w: number; h: number };
  onSelectSize?: (
    preset: JournalSizePreset,
    movement: { x: number; y: number }
  ) => void;
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
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

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

  useEffect(() => {
    setSelectedPresetId(null);
  }, [game.id]);

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
      <Pressable testID="journal-backdrop" style={styles.backdrop} onPress={handleClose} />
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
            </View>
            {onSelectSize && sizePresets.length > 0 ? (
              <View style={styles.sizeOptionsRow} testID="journal-size-options">
                {(() => {
                  const matchingPresets = sizePresets.filter(
                    (candidate) =>
                      candidate.w === currentSize?.w &&
                      candidate.h === currentSize?.h
                  );
                  const firstMatchingIndex = sizePresets.findIndex(
                    (candidate) =>
                      candidate.w === currentSize?.w &&
                      candidate.h === currentSize?.h
                  );
                  const hasActiveSelectedPreset =
                    selectedPresetId !== null &&
                    matchingPresets.some((candidate) => {
                      const candidateId =
                        candidate.id ?? `${candidate.w}x${candidate.h}`;
                      return (
                        candidateId === selectedPresetId &&
                        candidate.w === currentSize?.w &&
                        candidate.h === currentSize?.h
                      );
                    });
                  const inferredCurrentPreset =
                    !hasActiveSelectedPreset && game.board
                      ? inferPresetFromBoardAnchor(matchingPresets, game.board.x, game.board.y)
                      : null;
                  let currentPreset: JournalSizePreset | null = null;
                  if (hasActiveSelectedPreset) {
                    currentPreset =
                      matchingPresets.find((candidate) => {
                        const candidateId =
                          candidate.id ?? `${candidate.w}x${candidate.h}`;
                        return (
                          candidateId === selectedPresetId &&
                          candidate.w === currentSize?.w &&
                          candidate.h === currentSize?.h
                        );
                      }) ??
                      inferredCurrentPreset ??
                      null;
                  } else {
                    currentPreset =
                      inferredCurrentPreset ??
                      (firstMatchingIndex >= 0 ? sizePresets[firstMatchingIndex] : null);
                  }
                  const currentPresetId =
                    currentPreset ? currentPreset.id ?? `${currentPreset.w}x${currentPreset.h}` : null;
                  const currentAnchorOffset = getPresetAnchorOffset(currentPreset);
                  return sizePresets.map((preset, index) => {
                    const presetId = preset.id ?? `${preset.w}x${preset.h}`;
                    const currentSpanMatches =
                      preset.w === currentSize?.w && preset.h === currentSize?.h;
                    const selected =
                      (hasActiveSelectedPreset
                        ? selectedPresetId === presetId && currentSpanMatches
                        : currentPresetId !== null
                          ? currentPresetId === presetId
                          : index === firstMatchingIndex) && currentSpanMatches;
                    return (
                      <Pressable
                        key={`journal-size-${presetId}-${index}`}
                        testID={`journal-size-${presetId}`}
                        style={[
                          styles.sizeOptionButton,
                          selected && styles.sizeOptionButtonSelected,
                        ]}
                        onPress={() => {
                          setSelectedPresetId(presetId);
                          const nextAnchorOffset = getPresetAnchorOffset(preset);
                          onSelectSize(preset, {
                            x: nextAnchorOffset.x - currentAnchorOffset.x,
                            y: nextAnchorOffset.y - currentAnchorOffset.y,
                          });
                        }}
                      >
                        <GridGlyph
                          activePositions={
                            preset.activePositions ?? getDefaultActivePositionsForSpan(preset)
                          }
                          selected={selected}
                        />
                      </Pressable>
                    );
                  });
                })()}
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

function getDefaultActivePositionsForSpan(
  span: { w: number; h: number }
): readonly GridCellPosition[] {
  if (span.w >= 2 && span.h >= 2) return GRID_ACTIVE_FULL_GRID;
  if (span.w >= 2) return GRID_ACTIVE_TOP_ROW;
  if (span.h >= 2) return GRID_ACTIVE_LEFT_COLUMN;
  return GRID_ACTIVE_TOP_LEFT;
}

const GRID_POSITION_COORDS = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 1, y: 0 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-right": { x: 1, y: 1 },
} as const;

function getPresetAnchorOffset(
  preset: JournalSizePreset | null
): { x: number; y: number } {
  if (!preset) return { x: 0, y: 0 };
  const positions = preset.activePositions ?? getDefaultActivePositionsForSpan(preset);
  if (positions.length === 0) return { x: 0, y: 0 };

  const coords = positions.map((position) => GRID_POSITION_COORDS[position]);
  const minX = Math.min(...coords.map((coord) => coord.x));
  const minY = Math.min(...coords.map((coord) => coord.y));
  return { x: minX, y: minY };
}

function inferPresetFromBoardAnchor(
  presets: JournalSizePreset[],
  boardX: number,
  boardY: number
): JournalSizePreset | null {
  if (presets.length === 0) return null;
  if (presets.length === 1) return presets[0];

  const anchor = {
    x: ((boardX % 2) + 2) % 2,
    y: ((boardY % 2) + 2) % 2,
  };

  let best: {
    preset: JournalSizePreset;
    distance: number;
    index: number;
  } | null = null;

  presets.forEach((preset, index) => {
    const offset = getPresetAnchorOffset(preset);
    const distance =
      Math.abs(offset.x - anchor.x) + Math.abs(offset.y - anchor.y);

    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && index < best.index)
    ) {
      best = { preset, distance, index };
    }
  });

  return best?.preset ?? null;
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
    marginBottom: 14,
  },
  sizeOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
