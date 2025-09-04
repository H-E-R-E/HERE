import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useFonts } from "expo-font";

export default function Index() {
  const { userToken, loading } = useAuth();
  const router = useRouter();


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
        router.replace("/(tabs)/home");
      } else {
        router.replace("/onboarding/getstarted");
      }
    }
  }, [loading, userToken, fontsLoaded]);


  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
