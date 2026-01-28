import { Link } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-cream dark:bg-cream-dark">
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo className="mt-4 py-4">
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </View>
  );
}
