import { PaperBackground } from "@/components/paper-background";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";

export default function AddScreen() {
  return (
    <PaperBackground>
      <View className="flex-1 items-center justify-center">
        <ThemedText type="title">Add</ThemedText>
      </View>
    </PaperBackground>
  );
}
