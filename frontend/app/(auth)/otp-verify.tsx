import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AnimatedButton from "../../components/AnimatedButton";
import BlurryEllipse from "../../components/BlurryEllipse";
import ThemedText from "../../components/ThemedText";
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import { useSignupStore } from "../../data/signUpStore";
import { useVerifyOtp, useResendOtp } from "../services/otp.service";
import { AxiosError } from "axios";
import { useVerifyAccount } from "../services/verify-account.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyOtp() {
  const theme = useThemeColors();
  const router = useRouter();
  const { email } = useSignupStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
const verifyAccount = useVerifyAccount();

  const otpValue = otp.join("");
  const isFormValid = otpValue.length === OTP_LENGTH && /^\d{6}$/.test(otpValue);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  // Clear error when user edits
  useEffect(() => {
    if (error) setError("");
  }, [otp]);

  // Resend countdown
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

const handleVerify = async () => {
  if (!isFormValid) return;
  try {
    const otpData = await verifyOtp.mutateAsync({ email, otp: otpValue });
    await AsyncStorage.setItem("token", otpData.token);
    const accountData = await verifyAccount.mutateAsync();
    await AsyncStorage.setItem("token", accountData.token);

    router.replace("/(tabs)");
  } catch (err: unknown) {
    await AsyncStorage.removeItem("token");
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 422 || axiosErr.response?.status === 400) {
      setError("Invalid or expired code. Please try again.");
    } else {
      setError("Something went wrong. Please try again.");
    }
  }
};

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp.mutateAsync({ email });
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setCanResend(false);
      setCountdown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Could not resend code. Please try again.");
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        subtitle: {
          fontSize: 13,
          textAlign: "center",
          opacity: 0.7,
          lineHeight: 20,
        },
        emailHighlight: {
          color: theme.primary,
          fontSize: 13,
        },
        boxRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          width: 300,
          marginBottom: 12,
        },
        box: {
          width: 42,
          height: 48,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: theme.border,
          backgroundColor: theme.background,
          textAlign: "center",
          fontSize: 20,
          color: theme.text,
          fontFamily: "Poppins",
        },
        boxFocused: {
          borderColor: theme.primary,
        },
        errorText: {
          color: "#ef4444",
          fontSize: 12,
          marginBottom: 8,
          width: 300,
          textAlign: "center",
        },
        resendRow: {
          flexDirection: "row",
          marginTop: 12,
          alignItems: "center",
          gap: 4,
        },
        resendLabel: {
          fontSize: 13,
          color: theme.text,
          opacity: 0.7,
        },
        resendLink: {
          fontSize: 13,
          color: theme.primary,
        },
        resendDisabled: {
          opacity: 0.4,
        },
      }),
    [theme]
  );

  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollviewStyle}>
          <View style={styles.viewStyle}>
            <BlurryEllipse />
          </View>

          <View style={styles.headerContainer}>
            <ThemedText
              weight="bold"
              family="source"
              style={{ fontSize: 28, marginBottom: 8 }}
            >
              Verify your email
            </ThemedText>
            <ThemedText weight="regular" style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <ThemedText style={styles.emailHighlight} weight="semibold">
                {email}
              </ThemedText>
            </ThemedText>
          </View>

          {/* OTP boxes */}
          <View style={styles.boxRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.box, focusedIndex === index && styles.boxFocused]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <AnimatedButton
            onPress={handleVerify}
            width={300}
            borderWidth={0}
            disabled={!isFormValid || verifyOtp.isPending || verifyAccount.isPending}
            buttonStyles={{ opacity: !isFormValid ? 0.5 : 1 }}
          >
            {verifyOtp.isPending ? <ActivityIndicator /> : "Verify"}
          </AnimatedButton>

          {/* Resend */}
          <View style={styles.resendRow}>
            <ThemedText style={styles.resendLabel}>
              Didn't receive it?
            </ThemedText>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || resendOtp.isPending}
            >
              <ThemedText
                style={[
                  styles.resendLink,
                  (!canResend || resendOtp.isPending) && styles.resendDisabled,
                ]}
                weight="semibold"
              >
                {canResend
                  ? resendOtp.isPending
                    ? "Sending..."
                    : "Resend"
                  : `Resend in ${countdown}s`}
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}