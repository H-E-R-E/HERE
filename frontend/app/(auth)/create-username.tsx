import React, { useState, useMemo, useEffect } from "react";
import { 
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet, 
  TouchableOpacity,
  View, 
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AnimatedButton from "../../components/AnimatedButton";
import BlurryEllipse from "../../components/BlurryEllipse";
import InputField from "../../components/InputField";
import ThemedText from '../../components/ThemedText';
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import { useSignupStore } from "../../data/signUpStore";
import { useRegister } from "../services/signup.service";

export default function CreateUsername() {
  const theme = useThemeColors();
  const { setField, first_name } = useSignupStore();

  const [username, setUsername] = useState("");
  //const [isChecking, setIsChecking] = useState(false);
  //const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const register = useRegister();

  const router = useRouter();

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  function validateUsername(text: string): string | null {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!text.trim()) return "Username is required";
    if (text.length < 3) return "Username must be at least 3 characters";
    if (text.length > 20) return "Username must be less than 20 characters";
    if (!usernameRegex.test(text)) return "Username can only contain letters, numbers, and underscores";
    return null;
  }

 //Add check usename availability logic when we know that that exists
 /*
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (validateUsername(username) !== null || !username) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      setTimeout(() => {
        const available = !username.toLowerCase().includes("admin");
        setIsAvailable(available);
        setIsChecking(false);
      }, 800);
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);
*/

  useEffect(() => {
    const usernameValid = validateUsername(username) === null;
    setIsFormValid(usernameValid);
  }, [username]);

  const handleContinue = async() => {
    setField("username", username);
    try {
     const res = await register.mutateAsync();
     console.log("Signup complete", res);
     router.push('(auth)/login');
    } catch (err) {
    console.error("Signup failed:", err);
  }
    
  };

  /*const getAvailabilityMessage = () => {
    if (!username || validateUsername(username) !== null) return null;
    if (isChecking) return "Checking availability...";
    if (isAvailable === true) return "Username is available!";
    if (isAvailable === false) return "Username is already taken";
    return null;
  };

  const getAvailabilityColor = () => {
    if (isChecking) return theme.placeholderText;
    if (isAvailable === true) return "#4CAF50";
    if (isAvailable === false) return "#F44336";
    return theme.placeholderText;
  };
*/
  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputStyles: {
          backgroundColor: theme.background,
        },
        viewStyle: {
          top: 0,
          left: 0,
          position: "absolute",
        },
        scrollviewStyle: {
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 70,
          paddingHorizontal: 20,
          backgroundColor: theme.background,
        },
        headerContainer: {
          alignItems: "center",
          marginBottom: 40,
        },
        availabilityText: {
          fontSize: 13,
          marginTop: 8,
          marginBottom: 20,
        },
      }),
    [theme]
  );

  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollviewStyle}
        >
          <View style={styles.viewStyle}>
            <BlurryEllipse />
          </View>

          <View style={styles.headerContainer}>
            <ThemedText weight="bold" family="source" style={{ fontSize: 28, marginBottom: 8 }}>
              Choose a username
            </ThemedText>
            <ThemedText 
              weight="regular" 
              style={{ fontSize: 13, textAlign: 'center', opacity: 0.7 }}
            >
              {first_name ? `Hey ${first_name}! ` : ""}Pick a unique username for your profile
            </ThemedText>
          </View>

          <InputField
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            inputType="default"
            inputStyle={styles.inputStyles}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/*getAvailabilityMessage() && (
            <ThemedText 
              weight="regular" 
              style={[
                styles.availabilityText,
                { color: getAvailabilityColor() }
              ]}
            >
              {getAvailabilityMessage()}
            </ThemedText>
          )*/}

          <AnimatedButton 
            onPress={handleContinue} 
            width={300} 
            borderWidth={0}
            disabled={!isFormValid || register.isPending}
            buttonStyles={{ opacity: !isFormValid ? 0.5 : 1 }}
          >
            {register.isPending? <ActivityIndicator /> : "Go to Login"}
          </AnimatedButton>

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <ThemedText style={{ fontSize: 13 }}>
                <ThemedText style={{ color: theme.primary, fontSize: 13 }} weight="semibold">
                  ← Back
                </ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}