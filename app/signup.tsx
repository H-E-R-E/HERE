import React, { useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import InputField from "../components/InputField";
import AnimatedButton from "../components/AnimatedButton";
import { useRouter } from "expo-router";
import BlurryEllipse from "../components/BlurryEllipse"
import SvgIconSignUp from "../components/SvgPicSignUp";


export default function Signup() {

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
  const inputStyle = { borderColor: "#7851A966", backgroundColor: "#F8F8F8" };

  function googleVal() {

  }
  return (
    <>

<StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView 
    keyboardShouldPersistTaps="handled"   
    contentContainerStyle={{
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  }}> 

    <SvgIconSignUp height={20} width={20}/>
            <View style={{ top: 0, left: 0, position: "absolute"}}>
        <BlurryEllipse />
      </View>
        <InputField 
          placeholder="Name"
          value={userName}
          onChangeText={setUserName}
          inputType="default"
          inputStyle={inputStyle}
        />
        <InputField 
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          inputType="email"
          onValidate={validateEmail}
          inputStyle={inputStyle}
        />
        <InputField 
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          inputType="password"
          inputStyle={inputStyle}
        />
        

        <AnimatedButton onPress={() => (router.push("/home"))} width={300} borderWidth={0} >Sign Up</AnimatedButton>
      <Text style={{ marginTop: 20 }}>OR</Text>
      <AnimatedButton onPress={googleVal} width={300} bgcolor="#fff" color="#7851A9" borderColor="#7851A966" borderWidth={1}>Continue with Google</AnimatedButton>
      <AnimatedButton onPress={googleVal} width={300} bgcolor="#fff" color="#7851A9" borderColor="#7851A966"  borderWidth={1}>Continue with Apple</AnimatedButton>
    </ScrollView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({

})