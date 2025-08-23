import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { userToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (userToken) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/onboarding/getstarted");
      }
    }
  }, [loading, userToken]);

  if (loading) {
    return <ActivityIndicator />;
  }

  return null;
}
