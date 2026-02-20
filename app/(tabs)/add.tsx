import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export default function AddScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <ThemedText type="title">Add</ThemedText>
    </View>
  );
}
