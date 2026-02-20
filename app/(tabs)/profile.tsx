import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export default function ProfileScreen() {
  return (
    <View
      testID="screen-profile"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <ThemedText type="title">Profile</ThemedText>
    </View>
  );
}
