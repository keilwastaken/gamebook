import { type ComponentType, useRef, useState } from "react";
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
import {
  AlignLeftIcon,
  CameraIcon,
  CircleIcon,
  EnvelopeSimpleIcon,
  type IconProps,
  PushPinIcon,
  RectangleIcon,
  SquaresFourIcon,
  TicketIcon,
} from "phosphor-react-native";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import { useGamesContext } from "@/lib/games-context";
import {
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
  type CardMountStyle,
  type PostcardSide,
  type TicketType,
} from "@/lib/types";

const TICKET_TYPE_OPTIONS: Array<{
  id: TicketType;
  label: string;
  Icon: ComponentType<IconProps>;
}> = [
  { id: "polaroid", label: "Polaroid", Icon: CameraIcon },
  { id: "postcard", label: "Postcard", Icon: EnvelopeSimpleIcon },
  { id: "widget", label: "Widget", Icon: SquaresFourIcon },
  { id: "ticket", label: "Ticket", Icon: TicketIcon },
  { id: "minimal", label: "Minimal", Icon: AlignLeftIcon },
];

const MOUNT_STYLE_OPTIONS: Array<{
  id: CardMountStyle;
  label: string;
  Icon: ComponentType<IconProps>;
}> = [
  { id: "tape", label: "Tape", Icon: RectangleIcon },
  { id: "color-pin", label: "Pin", Icon: PushPinIcon },
  { id: "metal-pin", label: "Steel", Icon: CircleIcon },
];

const POSTCARD_SIDE_OPTIONS: Array<{ id: PostcardSide; label: string }> = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
];

export default function AddScreen() {
  const router = useRouter();
  const { addGameWithInitialNote, currentHomePage } = useGamesContext();
  const [title, setTitle] = useState("");
  const [whereLeftOff, setWhereLeftOff] = useState("");
  const [quickThought, setQuickThought] = useState("");
  const [ticketType, setTicketType] = useState<TicketType>(DEFAULT_TICKET_TYPE);
  const [mountStyle, setMountStyle] = useState<CardMountStyle>(
    DEFAULT_CARD_MOUNT_STYLE
  );
  const [postcardSide, setPostcardSide] = useState<PostcardSide>(
    DEFAULT_POSTCARD_SIDE
  );
  const [saving, setSaving] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isValid =
    title.trim().length > 0 && whereLeftOff.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await addGameWithInitialNote({
      title: title.trim(),
      whereLeftOff: whereLeftOff.trim(),
      quickThought: quickThought.trim() || undefined,
      ticketType,
      mountStyle,
      postcardSide,
      boardPage: currentHomePage,
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

          <Text style={styles.sectionLabel}>TICKET TYPE</Text>
          <View style={styles.ticketTypeRow}>
            {TICKET_TYPE_OPTIONS.map(({ id, label, Icon }) => {
              const selected = id === ticketType;
              return (
                <Pressable
                  key={id}
                  testID={`add-ticket-type-${id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${label} ticket type`}
                  accessibilityState={{ selected }}
                  onPress={() => setTicketType(id)}
                  style={[
                    styles.ticketTypeButton,
                    selected && styles.ticketTypeButtonSelected,
                  ]}
                >
                  <Icon
                    size={18}
                    color={selected ? palette.cream.DEFAULT : palette.sage[500]}
                    weight={selected ? "fill" : "regular"}
                  />
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.sectionLabel}>MOUNT STYLE</Text>
          <View style={styles.ticketTypeRow}>
            {MOUNT_STYLE_OPTIONS.map(({ id, label, Icon }) => {
              const selected = id === mountStyle;
              return (
                <Pressable
                  key={id}
                  testID={`add-mount-style-${id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${label} mount style`}
                  accessibilityState={{ selected }}
                  onPress={() => setMountStyle(id)}
                  style={[
                    styles.ticketTypeButton,
                    selected && styles.ticketTypeButtonSelected,
                  ]}
                >
                  <Icon
                    size={18}
                    color={selected ? palette.cream.DEFAULT : palette.sage[500]}
                    weight={selected ? "fill" : "regular"}
                  />
                </Pressable>
              );
            })}
          </View>
          {ticketType === "postcard" ? (
            <>
              <Text style={styles.sectionLabel}>POSTCARD SIDE</Text>
              <View style={styles.ticketTypeRow}>
                {POSTCARD_SIDE_OPTIONS.map(({ id, label }) => {
                  const selected = id === postcardSide;
                  return (
                    <Pressable
                      key={id}
                      testID={`add-postcard-side-${id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select postcard ${label.toLowerCase()} side`}
                      accessibilityState={{ selected }}
                      onPress={() => setPostcardSide(id)}
                      style={[
                        styles.sideButton,
                        selected && styles.sideButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sideButtonText,
                          selected && styles.sideButtonTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

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
    marginBottom: 12,
  },
  ticketTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  ticketTypeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.sage[300],
    backgroundColor: palette.cream.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketTypeButtonSelected: {
    backgroundColor: palette.sage[500],
    borderColor: palette.sage[500],
  },
  sideButton: {
    minWidth: 74,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.sage[300],
    backgroundColor: palette.cream.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sideButtonSelected: {
    backgroundColor: palette.sage[500],
    borderColor: palette.sage[500],
  },
  sideButtonText: {
    fontSize: 12,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.sage[500],
  },
  sideButtonTextSelected: {
    color: palette.cream.DEFAULT,
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
