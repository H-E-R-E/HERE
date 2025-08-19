import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import InputField from "../../components/InputField";
import AnimatedButton from "../../components/AnimatedButton";
import { useRouter } from "expo-router";
import BlurryEllipse from "../../components/BlurryEllipse"
import SvgIconSignUp from "../../components/SvgPicSignUp";
import useThemeColors from "../hooks/useThemeColors";


export default function Signup() {
  const color = useThemeColors();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();


function validateEmail(text: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!text.trim()) return "Email is required";
  if (!emailRegex.test(text)) return "Invalid email address";
  return null;
  }
  function googleVal() {

  }

  //may return back to outside component, just trying useMemo.
const styles = useMemo(() => StyleSheet.create({
  inputStyles: { 
    borderColor: color.border,
    backgroundColor: color.background,
   },

   viewStyle: {
     top: 0,
     left: 0, 
     position: "absolute"
   },

   scrollviewStyle: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  }
}), [color])


  return (
    <>
    
    <ScrollView 
    keyboardShouldPersistTaps="handled"   
    contentContainerStyle={styles.scrollviewStyle}> 

    <SvgIconSignUp height={20} width={20}/>
            <View style={styles.viewStyle}>
        <BlurryEllipse />
      </View>
        <InputField 
          placeholder="Name"
          value={userName}
          onChangeText={setUserName}
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
        

        <AnimatedButton onPress={() => (router.push("/home"))} width={300} borderWidth={0} >Sign Up</AnimatedButton>
      <Text style={{ marginTop: 20 }}>OR</Text>
      <AnimatedButton onPress={googleVal} width={300} bgcolor={color.background} color={color.primary} borderColor={color.border} borderWidth={1}>Continue with Google</AnimatedButton>
      <AnimatedButton onPress={googleVal} width={300} bgcolor={color.background} color={color.primary} borderColor={color.border}  borderWidth={1}>Continue with Apple</AnimatedButton>
    </ScrollView>
    </>
  );
}

