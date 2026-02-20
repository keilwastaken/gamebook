import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export default function LibraryScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <ThemedText type="title">Library</ThemedText>
    </View>
  );
}
