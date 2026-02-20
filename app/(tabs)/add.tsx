import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import { useGamesContext } from "@/lib/games-context";

export default function AddScreen() {
  const router = useRouter();
  const { addGameWithInitialNote } = useGamesContext();
  const [title, setTitle] = useState("");
  const [whereLeftOff, setWhereLeftOff] = useState("");
  const [quickThought, setQuickThought] = useState("");
  const [saving, setSaving] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isValid =
    title.trim().length > 0 && whereLeftOff.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await addGameWithInitialNote({
      title: title.trim(),
      progress: 0,
      whereLeftOff: whereLeftOff.trim(),
      quickThought: quickThought.trim() || undefined,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.replace("/(tabs)");
  };

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        testID="screen-add"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, CozyShadows.base]}>
          <Text style={styles.screenTitle}>Add to Shelf</Text>

          <Text style={styles.sectionLabel}>GAME TITLE</Text>
          <TextInput
            testID="add-title-input"
            style={styles.textInput}
            placeholder="e.g. Stardew Valley"
            placeholderTextColor={palette.text.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.sectionLabel}>WHERE I LEFT OFF</Text>
          <TextInput
            testID="add-where-input"
            style={styles.textInput}
            placeholder="What were you doing?"
            placeholderTextColor={palette.text.muted}
            value={whereLeftOff}
            onChangeText={setWhereLeftOff}
            multiline
            maxLength={200}
          />

          <Text style={styles.sectionLabel}>QUICK THOUGHT (optional)</Text>
          <TextInput
            testID="add-thought-input"
            style={[styles.textInput, styles.thoughtInput]}
            placeholder="How are you feeling about this game?"
            placeholderTextColor={palette.text.muted}
            value={quickThought}
            onChangeText={setQuickThought}
            multiline
            maxLength={200}
          />

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              testID="add-save-button"
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!isValid}
              accessibilityLabel="Save to shelf"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.saveButtonText,
                  !isValid && styles.saveButtonTextDisabled,
                ]}
              >
                Save to Shelf
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: palette.cream.DEFAULT,
    borderRadius: 24,
    padding: 24,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.text.primary,
    marginBottom: 24,
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
    marginBottom: 20,
    minHeight: 48,
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
