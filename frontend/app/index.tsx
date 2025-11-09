import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import useThemeColors from "../app/hooks/useThemeColors";

export default function Index() {
  const router = useRouter();
  const theme = useThemeColors();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    PoppinsSemiBold: require("../assets/fonts/Poppins-SemiBold.ttf"),
    SourceSansPro: require("../assets/fonts/SourceSansPro-Regular.ttf"),
    SourceSansProBold: require("../assets/fonts/SourceSansPro-Bold.ttf"),
    SourceSansProSemiBold: require("../assets/fonts/SourceSansPro-SemiBold.ttf"),
  });

  useEffect(() => {
    async function checkAuthAndNavigate() {
      if (!fontsLoaded) return;

      try {
        const token = await AsyncStorage.getItem("userToken");
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/(auth)/login");
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuthAndNavigate();
  }, [fontsLoaded]);


  if (!fontsLoaded || isCheckingAuth) {
    return (
      <SafeAreaView 
        style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center", 
          backgroundColor: theme.background 
        }}
      >
        <StatusBar style={theme.statusBar} translucent />
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return null;
}