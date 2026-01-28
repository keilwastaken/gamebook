import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center">
      <ThemedText className="text-2xl font-bold" type="title">
        Hello World
      </ThemedText>
    </ThemedView>
  );
}
