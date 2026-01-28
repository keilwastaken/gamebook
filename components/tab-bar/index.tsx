import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Dimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-theme-color";

import { CenterButton } from "./center-button";
import {
  CENTER_BUTTON_SIZE,
  CURVE_WIDTH,
  TABS,
  TAB_BAR_HEIGHT,
} from "./constants";
import { TabBarBackground } from "./tab-bar-background";
import { TabButton } from "./tab-button";

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const TAB_HEIGHT = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View className="absolute bottom-0 w-full" style={{ height: TAB_HEIGHT }}>
      <TabBarBackground
        width={width}
        height={TAB_HEIGHT}
        fillColor={theme.background}
        colorScheme={colorScheme}
      />

      <View className="flex-row items-center justify-between px-6">
        {TABS.map((tab, index) => {
          if (tab.isCenter) {
            return (
              <CenterButton
                key={tab.name}
                curveWidth={CURVE_WIDTH}
                buttonSize={CENTER_BUTTON_SIZE}
                onPress={() => navigation.navigate("add")}
              />
            );
          }

          const isFocused = state.routes[state.index]?.name === tab.name;
          const route = state.routes.find((r) => r.name === tab.name);

          const onPress = () => {
            if (!route) {
              navigation.navigate(tab.name);
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TabButton
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
              activeColor={theme.tabIconSelected}
              inactiveColor={theme.tabIconDefault}
              activeIconShadowColor={theme.tabIconShadow}
            />
          );
        })}
      </View>
    </View>
  );
}
