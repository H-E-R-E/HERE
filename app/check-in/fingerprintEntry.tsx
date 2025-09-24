// FingerprintScreen.js
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
//import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useThemeColors from "../hooks/useThemeColors";

export default function FingerprintScreen() {
  const theme = useThemeColors();
  const router = useRouter();

  /*  useEffect(() => {
    handleAuth();
  }, []);

async function handleAuth() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (!hasHardware || !supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        Alert.alert("Not Supported", "This device does not support fingerprint authentication.");
        router.back();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify with fingerprint",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        router.replace("/home"); // Navigate to the success screen
      } else {
        Alert.alert("Authentication Failed", "Fingerprint verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during fingerprint authentication:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  }*/

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        },
        title: {
          fontSize: 28,
          fontWeight: "700",
          color: theme.primary,
          marginBottom: 10,
        },
        subtitle: {
          fontSize: 16,
          color: "#666",
          textAlign: "center",
          marginBottom: 40,
        },
        fingerprintBox: {
          width: 150,
          height: 150,
          borderWidth: 2,
          borderColor: theme.primary,
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        },
        tapText: {
          fontSize: 14,
          color: "#999",
          marginTop: 10,
        },
        pinText: {
          fontSize: 16,
          color: theme.primary,
          marginTop: 20,
          textDecorationLine: "underline",
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify</Text>
      <Text style={styles.subtitle}>Place your finger on the fingerprint sensor to continue.</Text>

      <Pressable style={styles.fingerprintBox}>
        <Ionicons name="finger-print" size={100} color={theme.primary} />
      </Pressable>

      <Pressable onPress={() => router.push("/check-in/pinEntry")}>
        <Text style={styles.pinText}>Or use PIN instead</Text>
      </Pressable>
    </View>
  );
}

