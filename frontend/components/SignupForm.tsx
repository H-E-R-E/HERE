import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import InputField from './InputField';
import AnimatedButton from './AnimatedButton';
import useThemeColors from '../app/hooks/useThemeColors';
import { useSignupStore } from '../data/signUpStore';

interface SignupFormProps {
  onSuccess: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const theme = useThemeColors();
  const { setField } = useSignupStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  function splitFullName(fullName: string) {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    let lastName = '';
    if (nameParts.length > 1) lastName = nameParts[nameParts.length - 1];

    return { firstName, lastName };
  }

  function validateName(text: string): string | null {
    const fullNameRegex = /^[A-Za-z0-9-'\s]{2,}$/;
    if (!text.trim()) return 'Name is required';
    if (!fullNameRegex.test(text)) return 'Enter a first name and a last name';
    return null;
  }

  function validateEmail(text: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text.trim()) return 'Email is required';
    if (!emailRegex.test(text)) return 'Invalid email address';
    return null;
  }

  function validatePassword(text: string): string | null {
    if (!text.trim()) return 'Password is required';
    if (text.length < 6) return 'Password must be at least 6 characters';
    return null;
  }

  useEffect(() => {
    const nameValid = validateName(name) === null;
    const emailValid = validateEmail(email) === null;
    const passwordValid = validatePassword(password) === null;

    setIsFormValid(nameValid && emailValid && passwordValid);
  }, [name, email, password]);

  const handleDetailCollection = () => {
    const { firstName, lastName } = splitFullName(name);
    setField('email', email);
    setField('password', password);
    setField('first_name', firstName);
    setField('last_name', lastName);

    onSuccess({ firstName, lastName, email, password });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputStyles: {
          backgroundColor: theme.background,
        },
      }),
    [theme]
  );

  return (
    <View>
      <InputField
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        inputType="default"
        inputStyle={styles.inputStyles}
        onValidate={validateName}
      />

      <InputField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        inputType="email"
        inputStyle={styles.inputStyles}
        onValidate={validateEmail}
      />

      <InputField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        inputType="password"
        inputStyle={styles.inputStyles}
        onValidate={validatePassword}
      />

      <AnimatedButton
        onPress={handleDetailCollection}
        width={300}
        borderWidth={0}
        disabled={!isFormValid}
        buttonStyles={{ opacity: !isFormValid ? 0.5 : 1 }}
      >
        Sign Up
      </AnimatedButton>
    </View>
  );
};

export default SignupForm;