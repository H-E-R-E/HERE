import React from "react";
import { Stack } from "expo-router";
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
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(stack)" />
    </Stack>
      </View>
    </SafeAreaProvider>
    </EventProvider>
    </AuthProvider>
  );
}
