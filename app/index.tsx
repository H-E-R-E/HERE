import React from "react";
import { useEffect } from "react";
import { ActivityIndicator, View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useFonts } from "expo-font";
import { Poppins_400Regular } from "@expo-google-fonts/poppins";
import { StatusBar } from "expo-status-bar";
import useThemeColors from "../app/hooks/useThemeColors";

export default function Index() {
  const { userToken, loading } = useAuth();
  const router = useRouter();
  const theme = useThemeColors();

  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    PoppinsSemiBold: require("../assets/fonts/Poppins-SemiBold.ttf"),
    SourceSansPro: require("../assets/fonts/SourceSansPro-Regular.ttf"),
    SourceSansProBold: require("../assets/fonts/SourceSansPro-Bold.ttf"),
    SourceSansProSemiBold: require("../assets/fonts/SourceSansPro-SemiBold.ttf"),
  });

  useEffect(() => {
    if (!loading && fontsLoaded) {
      if (userToken) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/getstarted");
      }
    }
  }, [loading, userToken, fontsLoaded]);

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBar} translucent />
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return null;
}
