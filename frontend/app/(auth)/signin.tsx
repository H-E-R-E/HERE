import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import useThemeColors from '../hooks/useThemeColors';
import AnimatedButton from '../../components/AnimatedButton';
import BlurryEllipse from '../../components/BlurryEllipse';
import SvgPicSignUp from '../../components/SvgPicSignUp';
import ThemedText from '../../components/ThemedText';
import LoginForm from '../../components/LoginForm';
import SignupForm from '../../components/SignupForm';
import { User } from '../../types/UserTypes';

export default function SignIn() {
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const theme = useThemeColors();
  const router = useRouter();
  const { signIn } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins: require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    console.log("Form showed: ", mode);
  }, [mode])

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const handleLoginSuccess = async (user: User, token: string) => {
    await signIn(user, token);
    router.replace('/(tabs)');
  };

  const handleSignupSuccess = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    router.push('/(auth)/create-username');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        containerStyles: {
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
          paddingHorizontal: 20,
          backgroundColor: theme.background,
        },
        viewStyles: {
          top: 0,
          left: 0,
          position: 'absolute',
        },
      }),
    [theme]
  );

  if (!fontsLoaded) {
    return <ActivityIndicator />;
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

          {/* Render form based on mode */}
          {mode === 'login' ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <SignupForm onSuccess={handleSignupSuccess} />
          )}

          <ThemedText style={{ marginVertical: 2, color: theme.text }}>
            Or
          </ThemedText>

          <AnimatedButton
            onPress={() => {
              // TODO: implement Google auth
            }}
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
            onPress={() => {
              // TODO: implement Apple auth
            }}
            width={300}
            bgcolor={theme.background}
            color={theme.primary}
            borderColor={theme.border}
            borderWidth={1}
          >
            Continue with Apple
          </AnimatedButton>

          {/* Mode switch link */}
          <View>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <ThemedText style={{ fontSize: 13, marginLeft: 'auto', color: theme.text }}>
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <ThemedText
                      style={{ color: theme.primary, fontSize: 13 }}
                      weight="semibold"
                    >
                      Sign up
                    </ThemedText>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <ThemedText
                      style={{ color: theme.primary, fontSize: 13 }}
                      weight="semibold"
                    >
                      Log in
                    </ThemedText>
                  </>
                )}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}