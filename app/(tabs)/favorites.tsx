import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export default function FavoritesScreen() {
  return (
    <View
      testID="screen-favorites"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <ThemedText type="title">Favorites</ThemedText>
    </View>
  );
}
