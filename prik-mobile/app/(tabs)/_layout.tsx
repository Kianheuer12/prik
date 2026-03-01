import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme, useColors } from "../../contexts/ThemeContext";

export const FLOATING_TAB_PADDING = 96;

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const colors = useColors();
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const icon: "moon" | "sunny" | "phone-portrait-outline" =
    theme === "dark" ? "moon" : theme === "light" ? "sunny" : "phone-portrait-outline";
  return (
    <TouchableOpacity
      onPress={() => setTheme(next)}
      style={{ marginRight: 16 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: 28,
          height: 64,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarItemStyle: { height: 64, paddingVertical: 10 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Log Reading",
          tabBarLabel: "Log",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
