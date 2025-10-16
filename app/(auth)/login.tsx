import React, { useState, useMemo, useEffect } from "react";
import { 
  ActivityIndicator, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AnimatedButton from "../../components/AnimatedButton";
import BlurryEllipse from "../../components/BlurryEllipse";
import InputField from "../../components/InputField";
import SvgPicSignUp from "../../components/SvgPicSignUp";
import ThemedText from '../../components/ThemedText';
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useFonts } from "expo-font";
import BouncyCheckbox from "react-native-bouncy-checkbox";



export default function Login() {
  const { signIn } = useAuth();
  const theme = useThemeColors();
  const [usernameEmail, setUsernameEmail] = useState("");
  // Remove the email later
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [rememberMe, setRemeberMe] = useState(false)

  const router = useRouter();

  function handleToggle() {
    setRemeberMe(!rememberMe)
  }

  //Cleanup for keyboard opening, idk
  useEffect(()=>{
  return () => {
    Keyboard.dismiss() 
  }
},[])


  //Form validation fnxs
  function validateInput(text: string): string | null {
    if (!text.trim()) return "Username or Email is required";
    if (text.length < 2) return "Input must be at least 2 characters";
    return null;
  }

  function validatePassword(text: string): string | null {
    if (!text.trim()) return "Password is required";
    if (text.length < 6) return "Password must be at least 6 characters";
    return null;
  }

  function googleVal() {
    // TODO: implement Google auth
  }

  useEffect(() => {
    const inputValid = validateInput(usernameEmail) === null;
    const passwordValid = validatePassword(password) === null;

    setIsFormValid(inputValid && passwordValid);
  }, [usernameEmail, password]);

  const handleLogin = async () => {
    if (!isFormValid) return;
    const fauxUser = { id: "10", name: usernameEmail, email, pin: null };
    const fauxToken = "dummy-token";

    // TODO: Add logic here to securely store the token only if rememberMe is true
    await signIn(fauxUser, fauxToken);
    // Use router.replace to prevent the user from hitting back to the login screen
    router.replace("/(tabs)/home"); 
  };


  const [fontsLoaded] = useFonts({
  'Poppins': require('../../assets/fonts/Poppins-Regular.ttf'),
  });


  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputStyles: {
          backgroundColor: theme.background,
        },
        containerStyles: {
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 40,
          paddingHorizontal: 20,
          backgroundColor: theme.background,
        },
        viewStyles: {
          top: 0,
          left: 0,
          position: "absolute",
        },

        onboardingContainer: {
          width: 300, 
          marginTop: 5,
          marginBottom: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      }),
    [theme]
  );


  if (!fontsLoaded) {
    return <ActivityIndicator />
  }

  return (
    <>
    <StatusBar style={theme.statusBar} translucent />
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
    <ScrollView
        contentContainerStyle={styles.containerStyles}
        keyboardShouldPersistTaps="always"
      >
        <SvgPicSignUp height={20} width={20} />
        <View style={styles.viewStyles}>
          <BlurryEllipse />
        </View>

        {/*Username/Email field*/}
        <InputField
          placeholder="Username/Email"
          value={usernameEmail}
          onChangeText={setUsernameEmail}
          inputType="default"
          inputStyle={styles.inputStyles}
        />

        {/*Password field*/}
        <InputField
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          inputType="password"
          inputStyle={styles.inputStyles}
        />

        {/*Forgot password and Remember Me*/}
        <View style={styles.onboardingContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: 150 }}>
          <BouncyCheckbox
            size={20}
            fillColor={theme.primary}
            isChecked={rememberMe}
            iconStyle={{ borderRadius: 4 }}
            innerIconStyle={{ borderWidth: 1, borderRadius: 4, margin: 0 }}
            text="Remember Me?"
            onPress={handleToggle}
            disableText={false}
            textStyle={{ 
              textDecorationLine: "none",
              color: theme.text, 
              marginLeft: 0, 
              fontSize: 12,
              fontFamily: 'Poppins', 
              }} 
            />
          </View>
          
          <TouchableOpacity>
            <ThemedText style={{ color: theme.primary }}>
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>
        </View>

           <AnimatedButton 
          onPress={handleLogin} 
          width={300} 
          borderWidth={0}
          disabled={!isFormValid}
          buttonStyles={{ opacity: !isFormValid ? 0.5 : 1}}
          marginBottom={0}
        >
          Sign In
        </AnimatedButton>
        <ThemedText style={{ marginVertical: 2, color: theme.text }}>Or</ThemedText>
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
          {/*Sign up link*/}
          <View>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <ThemedText style={{ fontSize: 13, marginLeft: 'auto', color: theme.text }} >
              Don't have an account? <ThemedText style={{ color: theme.primary, fontSize: 13, marginLeft: 'auto' }} weight="semibold">Sign up</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>

       
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}