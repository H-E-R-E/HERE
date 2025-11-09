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
import { useSignupStore } from "../../data/signUpStore";


//TODO: Add little scale animation to toggle password button. Why? Idk
export default function Signup() {
  const theme = useThemeColors();
  const { setField } = useSignupStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const router = useRouter();

    useEffect(()=>{
    return () => {
      Keyboard.dismiss() 
    }
  },[])

  function splitFullName(fullName: string) {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    let lastName = "";
    if (nameParts.length > 1) lastName = nameParts[nameParts.length - 1]
      
    return { firstName, lastName }
  }

  //The validation fxns
  function validateName(text: string): string | null {
    const fullNameRegex = /^[A-Za-z0-9-'\s]{2,}$/
    if (!text.trim()) return "Name is required";
    if (!fullNameRegex.test(text)) return "Enter a first name and a last name";
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

  }

  // Validate tha form
  useEffect(() => {
    const usernameValid = validateName(name) === null;
    const emailValid = validateEmail(email) === null;
    const passwordValid = validatePassword(password) === null;

    setIsFormValid(usernameValid && emailValid && passwordValid);
  }, [name, email, password]);

  const handleDetailCollection = () => {
    const { firstName, lastName } = splitFullName(name)
    setField("email", email);
    setField("password", password);
    setField("first_name", firstName)
    setField("last_name", lastName)

    router.push('/(auth)/create-username')
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
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
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
          onPress={handleDetailCollection} 
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