import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import useThemeColors from "./hooks/useThemeColors";
import { AuthProvider } from "../context/AuthContext";
import { EventProvider } from "../context/EventContext";

export default function Layout() {
  const theme = useThemeColors();

  return (
    <AuthProvider>
    <EventProvider>
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Slot />
      </View>
    </SafeAreaProvider>
    </EventProvider>
    </AuthProvider>
  );
}
