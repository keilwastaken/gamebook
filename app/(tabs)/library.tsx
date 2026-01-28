import { PaperBackground } from "@/components/paper-background";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";

export default function LibraryScreen() {
  return (
    <PaperBackground>
      <View className="flex-1 items-center justify-center">
        <ThemedText type="title">Library</ThemedText>
      </View>
    </PaperBackground>
  );
}
