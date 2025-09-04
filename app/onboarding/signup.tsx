import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView } from "react-native";
import ThemedText from '../../components/ThemedText';
import InputField from "../../components/InputField";
import AnimatedButton from "../../components/AnimatedButton";
import { useRouter } from "expo-router";
import BlurryEllipse from "../../components/BlurryEllipse";
import SvgIconSignUp from "../../components/SvgPicSignUp";
import useThemeColors from "../hooks/useThemeColors";
import { useAuth } from "../../context/AuthContext";
import { StatusBar } from "expo-status-bar";


export default function Signup() {
  const { signIn } = useAuth();
  const theme = useThemeColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const router = useRouter();

  // Validate username
  function validateUsername(text: string): string | null {
    if (!text.trim()) return "Name is required";
    if (text.length < 2) return "Name must be at least 2 characters";
    return null;
  }

  // Validate password
  function validatePassword(text: string): string | null {
    if (!text.trim()) return "Password is required";
    if (text.length < 6) return "Password must be at least 6 characters";
    // Add more password requirements as needed
    return null;
  }

  function validateEmail(text: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text.trim()) return "Email is required";
    if (!emailRegex.test(text)) return "Invalid email address";
    return null;
  }

  function googleVal() {
    // TODO: implement Google auth
  }

  // Validate form
  useEffect(() => {
    const usernameValid = validateUsername(username) === null;
    const emailValid = validateEmail(email) === null;
    const passwordValid = validatePassword(password) === null;

    setIsFormValid(usernameValid && emailValid && passwordValid);
  }, [username, email, password]);

  const handleSignup = async () => {
    if (!isFormValid) return;
    
    //add backend to this part.
    //for 'simulation', only async storage was used.
    //so fauxtoken, will be a real token generated from the backend.
    const fauxUser = { id: "1", name: username, email };
    const fauxToken = "dummy-token";
    await signIn(fauxUser, fauxToken);
    router.replace("/onboarding/interests");
  };

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
          paddingVertical: 40,
          paddingHorizontal: 20,
        },
      }),
    [theme]
  );

  return (
    <>
    <StatusBar style={theme.statusBar} translucent />
    <KeyboardAvoidingView style={{ flex: 1}} behavior="padding" >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollviewStyle}
      >
        <SvgIconSignUp height={20} width={20} />
        <View style={styles.viewStyle}>
          <BlurryEllipse />
        </View>

        <InputField
          placeholder="Name"
          value={username}
          onChangeText={setUsername}
          inputType="default"
          inputStyle={styles.inputStyles}
        />

        <InputField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          inputType="email"
          onValidate={validateEmail}
          inputStyle={styles.inputStyles}
        />

        <InputField
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          inputType="password"
          inputStyle={styles.inputStyles}
        />

        <AnimatedButton 
          onPress={handleSignup} 
          width={300} 
          borderWidth={0}
          disabled={!isFormValid}
          buttonStyles={{ opacity: !isFormValid ? 0.5 : 1}}
          
        >
          Sign Up
        </AnimatedButton>
        <ThemedText weight="regular" style={{ marginTop: 20 }}>OR</ThemedText>
        <AnimatedButton
          onPress={googleVal}
          width={300}
          bgcolor={theme.background}
          color={theme.primary}
          borderColor={theme.border}
          borderWidth={1}
        >
          Continue with Google
        </AnimatedButton>
        <AnimatedButton
          onPress={googleVal}
          width={300}
          bgcolor={theme.background}
          color={theme.primary}
          borderColor={theme.border}
          borderWidth={1}
        >
          Continue with Apple
        </AnimatedButton>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}