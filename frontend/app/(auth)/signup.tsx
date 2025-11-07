import React, { useState, useMemo, useEffect } from "react";
import { 
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
import SvgIconSignUp from "../../components/SvgPicSignUp";
import ThemedText from '../../components/ThemedText';
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";


//TODO: Add little scale animation to toggle password button. Why? Idk
export default function Signup() {
  const { signIn } = useAuth();
  const theme = useThemeColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const router = useRouter();

    useEffect(()=>{
    return () => {
      Keyboard.dismiss() 
    }
  },[])

  //The validation fxns
  function validateUsername(text: string): string | null {
    if (!text.trim()) return "Name is required";
    if (text.length < 2) return "Name must be at least 2 characters";
    return null;
  }


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

  // Validate tha form
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
    const fauxUser = { id: "10", name: username, email, pin: null };
    const fauxToken = "dummy-token";
    await signIn(fauxUser, fauxToken);
    router.push("/(auth)/create-here-pin");
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
          paddingVertical: 70,
          paddingHorizontal: 20,
          backgroundColor: theme.background,

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
        <ThemedText weight="regular" style={{ marginTop: 0 }}>OR</ThemedText>
        <AnimatedButton
          onPress={googleVal}
          width={300}
          bgcolor={theme.background}
          color={theme.primary}
          borderColor={theme.border}
          borderWidth={1}
          marginBottom={0}
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
         <View>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={{ fontSize: 13, marginLeft: 'auto', marginBottom: 30 }} >
              Already have an account? <ThemedText style={{ color: theme.primary, fontSize: 13, marginLeft: 'auto' }} weight="semibold">Log in</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}