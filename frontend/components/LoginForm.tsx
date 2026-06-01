import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import InputField from './InputField';
import AnimatedButton from './AnimatedButton';
import ThemedText from './ThemedText';
import useThemeColors from '../app/hooks/useThemeColors';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useLogin } from '../app/services/login.service';
import { User } from '../types/UserTypes';
import { AxiosError } from 'axios';

interface LoginFormProps {
  onSuccess: (user: User, token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const theme = useThemeColors();
  const [usernameEmail, setUsernameEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const login = useLogin();

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [usernameEmail, password]);

  function validateInput(text: string): string | null {
    if (!text.trim()) return 'Username or Email is required';
    if (text.length < 2) return 'Input must be at least 2 characters';
    return null;
  }

  function validatePassword(text: string): string | null {
    if (!text.trim()) return 'Password is required';
    if (text.length < 6) return 'Password must be at least 6 characters';
    return null;
  }

  useEffect(() => {
    const inputValid = validateInput(usernameEmail) === null;
    const passwordValid = validatePassword(password) === null;
    setIsFormValid(inputValid && passwordValid);
  }, [usernameEmail, password]);

  const handleLogin = async () => {
    if (!isFormValid) return;
    try {
      const data = await login.mutateAsync({
        identifier: usernameEmail,
        password: password,
      });

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.username,
      };

      onSuccess(user, data.access_token);
    } catch (err: unknown) {
      const error = err as AxiosError;
      if (error.response?.status === 401) {
        setError('Please check your username or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputStyles: {
          backgroundColor: theme.background,
        },
        onboardingContainer: {
          width: 300,
          marginTop: 5,
          marginBottom: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        errorText: {
          color: '#ef4444',
          fontSize: 12,
          marginBottom: 8,
          width: 300,
        },
      }),
    [theme]
  );

  return (
    <View>
      <InputField
        placeholder="Username/Email"
        value={usernameEmail}
        onChangeText={setUsernameEmail}
        inputType="default"
        inputStyle={styles.inputStyles}
        onValidate={validateInput}
      />

      <InputField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        inputType="password"
        inputStyle={styles.inputStyles}
        onValidate={validatePassword}
      />

      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : null}

      <View style={styles.onboardingContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: 150 }}>
          <BouncyCheckbox
            size={20}
            fillColor={theme.primary}
            isChecked={rememberMe}
            iconStyle={{ borderRadius: 4 }}
            innerIconStyle={{ borderWidth: 1, borderRadius: 4, margin: 0 }}
            text="Remember Me?"
            onPress={() => setRememberMe(!rememberMe)}
            disableText={false}
            textStyle={{
              textDecorationLine: 'none',
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
        disabled={!isFormValid || login.isPending}
        buttonStyles={{ opacity: !isFormValid ? 0.5 : 1 }}
        marginBottom={0}
      >
        {login.isPending ? <ActivityIndicator /> : 'Sign In'}
      </AnimatedButton>
    </View>
  );
};

export default LoginForm;