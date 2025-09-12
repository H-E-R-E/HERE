import React, { useState } from "react";
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  placeholder?: string;
  value: string | undefined;
  onChangeText: (text: string) => void;
  onValidate?: (text: string) => string | null;
  onFormat?: (text: string) => string;
  errorMessage?: string;
  showError?: boolean;
  inputType?: 'default' | 'email' | 'phone' | 'password' | 'numeric';
  maxLength?: number;
  required?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  errorStyle?: object;
  showPasswordToggle?: boolean;
  toggleIconSize?: number;
  toggleIconColor?: string;
  showSearchButton?: boolean;
  onSearchPress?: () => void;
}

export default function InputField({
  placeholder,
  value,
  onChangeText,
  onValidate,
  onFormat,
  errorMessage,
  showError = true,
  inputType = 'default',
  maxLength,
  required = false,
  containerStyle,
  inputStyle,
  errorStyle,
  showPasswordToggle,
  toggleIconSize = 20,
  toggleIconColor = "#666",
  showSearchButton = false,
  onSearchPress,
  ...textInputProps
}: InputFieldProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const shouldShowToggle = showPasswordToggle ?? (inputType === 'password');

  const handleTextChange = (text: string) => {
    const formattedText = onFormat ? onFormat(text) : text;
    
    // Only validate after user has interacted and blurred at least once
    if (onValidate && hasBlurred) {
      const error = onValidate(formattedText);
      setLocalError(error);
    } else if (onValidate && !hasBlurred) {
      // Clear any existing error when typing before first blur
      setLocalError(null);
    }
    
    onChangeText(formattedText);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBlurred(true);
    
    // Validate on blur
    if (onValidate && value) {
      const error = onValidate(value);
      setLocalError(error);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getKeyboardType = () => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'numeric':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const getAutoCompleteType = () => {
    switch (inputType) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'password':
        return 'password';  
      default:
        return 'off';
    }
  };

  const isSecureTextEntry = inputType === 'password' && !isPasswordVisible;
  const displayError = showError && (localError || errorMessage);

  return (
    <View style={[styles.container, containerStyle]}>      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            displayError && styles.inputError,
            (shouldShowToggle || showSearchButton) && styles.inputWithIcon,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#00000059"
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={getKeyboardType()}
          autoComplete={getAutoCompleteType()}
          secureTextEntry={isSecureTextEntry}
          maxLength={maxLength}
          {...textInputProps}
        />
        
        {shouldShowToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={toggleIconSize}
              color={toggleIconColor}
            />
          </TouchableOpacity>
        )}

        {showSearchButton && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search"
              size={toggleIconSize}
              color={toggleIconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {displayError && (
        <ThemedText style={[styles.errorText, errorStyle]} weight="regular">
          {localError || errorMessage}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: "#7851A966",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 65,
    fontSize: 13,
    width: 320,
    backgroundColor: "#E9E6EE",
    fontFamily: 'Poppins',
    color: "#333",
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputFocused: {
    borderColor: "#7851A9",
    borderWidth: 1,
  },
  inputError: {
    borderColor: "#E74C3C",
    borderWidth: 1,
    backgroundColor: "#FFF5F5",
  },
  toggleButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
    fontFamily: 'Poppins',
  },
});