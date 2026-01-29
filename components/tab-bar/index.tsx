import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Dimensions, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-theme-color";

import { CenterButton } from "./center-button";
import { ICON_SIZE_RATIO, TAB_BAR_HEIGHT_RATIO, TABS } from "./constants";
import { TabBarBackground } from "./tab-bar-background";
import { TabButton } from "./tab-button";

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = Dimensions.get("window");
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const tabBarHeight = width * TAB_BAR_HEIGHT_RATIO;
  const iconSize = width * ICON_SIZE_RATIO;

  return (
    <View className="absolute bottom-0 w-full" style={{ height: tabBarHeight }}>
      <TabBarBackground width={width} />

      <View className="flex-1 flex-row items-center justify-evenly px-[5%]">
        {TABS.map((tab) => {
          if (tab.isCenter) {
            return (
              <CenterButton
                key={tab.name}
                size={iconSize * 2.5}
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
              iconSize={iconSize}
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
