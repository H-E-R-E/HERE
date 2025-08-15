import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import useThemeColors from "./hooks/useThemeColors";

export default function Layout() {
  const theme = useThemeColors();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
