import { ScrollView, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/palette";
import {
  MinimalCard,
  PolaroidCard,
  PostcardCard,
  TicketCard,
  WidgetCard,
} from "@/components/cards";

const DEMO_GAMES = [
  { title: "Stardew Valley", playtime: "24h 12m", progress: 0.6 },
  { title: "Spiritfarer", playtime: "8h 45m", progress: 0.3 },
  { title: "Animal Crossing", playtime: "120h 0m", progress: 0.9 },
  { title: "Elden Ring", playtime: "45h 30m", progress: 0.75 },
  { title: "Cozy Grove", playtime: "15h 20m", progress: 0.4 },
];

export default function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Collection Styles</Text>
        <Text style={styles.subtitle}>Tap to change style?</Text>
      </View>
      <View style={styles.board}>
        <View style={styles.row}>
          <PolaroidCard game={DEMO_GAMES[0]} seed={1} />
          <PostcardCard game={DEMO_GAMES[1]} seed={2} />
        </View>
        <View style={[styles.row, styles.rowOffset]}>
          <WidgetCard game={DEMO_GAMES[2]} seed={3} />
          <TicketCard game={DEMO_GAMES[3]} seed={4} />
        </View>
        <View style={styles.row}>
          <MinimalCard game={DEMO_GAMES[4]} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.warm[600],
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 12,
    color: palette.warm[600],
    opacity: 0.6,
    marginTop: 2,
  },
  board: {},
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  rowOffset: {
    marginLeft: 24,
  },
});
