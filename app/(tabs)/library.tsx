import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export default function LibraryScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <ThemedText type="title">Library</ThemedText>
    </View>
  );
}
