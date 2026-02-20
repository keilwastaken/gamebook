import { StyleSheet, View } from "react-native";

import { palette } from "@/constants/palette";
import type { CardMountStyle } from "@/lib/types";
import { CozyShadows } from "@/utils/shadows";

export function MountAdornment({
  mountStyle = "tape",
}: {
  mountStyle?: CardMountStyle;
}) {
  if (mountStyle === "tape") {
    return <View style={styles.tape} />;
  }

  const isMetal = mountStyle === "metal-pin";
  return (
    <View style={styles.pinWrap}>
      <View
        style={[
          styles.pinHead,
          isMetal ? styles.pinMetal : styles.pinColor,
          CozyShadows.micro,
        ]}
      />
      <View style={styles.pinNeedle} />
    </View>
  );
}

const styles = StyleSheet.create({
  tape: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 18,
    borderWidth: 1,
    borderColor: palette.warm[200],
    backgroundColor: palette.cream.DEFAULT,
    opacity: 0.62,
    zIndex: 3,
    transform: [{ rotate: "6deg" }],
  },
  pinWrap: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -8,
    zIndex: 3,
    alignItems: "center",
  },
  pinHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinColor: {
    backgroundColor: palette.clay[500],
    borderWidth: 1,
    borderColor: palette.warm[100],
  },
  pinMetal: {
    backgroundColor: palette.warm[300],
    borderWidth: 1,
    borderColor: palette.warm[200],
  },
  pinNeedle: {
    width: 2,
    height: 10,
    backgroundColor: palette.warm[300],
    marginTop: -2,
    borderRadius: 1,
    opacity: 0.8,
  },
});
