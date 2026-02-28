import { Tabs } from "expo-router";
import { Colors } from "../../constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: "Log Reading", tabBarLabel: "Log" }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarLabel: "History" }}
      />
    </Tabs>
  );
}
