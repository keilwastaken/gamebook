import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
    BookOpen,
    Heart,
    Home,
    Plus,
    User,
    type LucideIcon,
} from "lucide-react-native";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { palette } from "@/constants/palette";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-theme-color";

interface TabConfig {
  name: string;
  label: string;
  icon: LucideIcon;
  isCenter?: boolean;
}

const TABS: TabConfig[] = [
  { name: "index", label: "Home", icon: Home },
  { name: "library", label: "Library", icon: BookOpen },
  { name: "add", label: "Add", icon: Plus, isCenter: true },
  { name: "favorites", label: "Favorites", icon: Heart },
  { name: "profile", label: "Profile", icon: User },
];

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const TAB_HEIGHT = 60 + insets.bottom;
  const CENTER_BUTTON_SIZE = 56;
  const CURVE_WIDTH = 80;
  const CURVE_DEPTH = 32;

  // Generate the SVG path for the tab bar with a central "divot"
  const center = width / 2;
  const d = `
    M 0 0
    L ${center - CURVE_WIDTH / 2} 0
    C ${center - CURVE_WIDTH / 3} 0 ${center - CURVE_WIDTH / 4} ${CURVE_DEPTH} ${center} ${CURVE_DEPTH}
    C ${center + CURVE_WIDTH / 4} ${CURVE_DEPTH} ${center + CURVE_WIDTH / 3} 0 ${center + CURVE_WIDTH / 2} 0
    L ${width} 0
    L ${width} ${TAB_HEIGHT}
    L 0 ${TAB_HEIGHT}
    Z
  `;

  return (
    <View className="absolute bottom-0 w-full" style={{ height: TAB_HEIGHT }}>
      {/* Background with Divot */}
      <View style={StyleSheet.absoluteFill}>
        <Svg
          width={width}
          height={TAB_HEIGHT}
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Path
            d={d}
            fill={theme.background}
            stroke={
              colorScheme === "dark" ? palette.sage[700] : palette.sage[100]
            }
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* Tabs Container */}
      <View className="flex-row items-start justify-between px-2 pt-2">
        {TABS.map((tab, index) => {
          if (tab.isCenter) {
            return (
              <View
                key={tab.name}
                className="items-center justify-center"
                style={{
                  width: CURVE_WIDTH, // Occupy the center space
                  marginTop: -28, // Pull button up
                }}
              >
                <Pressable
                  onPress={() => navigation.navigate("add")}
                  className="rounded-full items-center justify-center shadow-lg bg-sage-200 dark:bg-sage-700 active:bg-sage-300"
                  style={{
                    width: CENTER_BUTTON_SIZE,
                    height: CENTER_BUTTON_SIZE,
                    shadowColor: palette.sage[600],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Plus size={28} color={theme.tint} strokeWidth={2.5} />
                </Pressable>
              </View>
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

          const activeColor = theme.tabIconSelected;
          const inactiveColor = theme.tabIconDefault;

          // Add extra spacing to the neighbors of the center button
          const isLeftNeighbor = index === 1; // Library
          const isRightNeighbor = index === 3; // Favorites
          const marginStyle = isLeftNeighbor
            ? { marginRight: 10 }
            : isRightNeighbor
              ? { marginLeft: 10 }
              : {};

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              className="items-center justify-center py-2 flex-1"
              style={marginStyle}
            >
              <tab.icon
                size={24}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  isFocused
                    ? "text-sage-500 dark:text-sage-50"
                    : "text-sage-400 dark:text-sage-300"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
