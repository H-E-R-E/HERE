import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();
  const rootNavigation = useRootNavigationState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //logo shall stay longer when we actuallly need to check stuff.
    if (!rootNavigation?.key) return;


    async function checkSession() {
      const token = await AsyncStorage.getItem("userToken"); //just here waiting for the other person.
      if (token) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/onboarding/getstarted");
      }
      setLoading(false);
    }

    checkSession();
  }, [rootNavigation?.key]);

  if (loading) {
    return (
    <ActivityIndicator />


    )

  }

  return null;
}
