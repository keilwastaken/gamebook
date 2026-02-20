import { Tabs } from "expo-router";
import React from "react";

import { TabBar } from "@/components/tab-bar";
import { GamesProvider } from "@/lib/games-context";

export default function TabLayout() {
  return (
    <GamesProvider>
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
    </GamesProvider>
  );
}
