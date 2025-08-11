import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons'; // or whatever icon library you're using

interface InputFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onValidate?: (text: string) => string | null; // Returns error message or null
  onFormat?: (text: string) => string; // Format text as user types
  errorMessage?: string;
  showError?: boolean;
  inputType?: 'default' | 'email' | 'phone' | 'password' | 'numeric';
  maxLength?: number;
  required?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  errorStyle?: object;
  // New props for password toggle
  showPasswordToggle?: boolean; // Allow override even for password type
  toggleIconSize?: number;
  toggleIconColor?: string;
  showSearchButton?: boolean; // if true, shows the search icon
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
  const [searchButton, setSearchButtton] = useState(false);

  // Determine if we should show the toggle (default true for password type)
  const shouldShowToggle = showPasswordToggle ?? (inputType === 'password');

  const handleTextChange = (text: string) => {
    // Apply formatting if provided
    const formattedText = onFormat ? onFormat(text) : text;
    
    // Validate if validator provided
    if (onValidate) {
      const error = onValidate(formattedText);
      setLocalError(error);
    }
    
    onChangeText(formattedText);
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

  // Determine if input should be secure (hidden)
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
            (shouldShowToggle || showSearchButton) && styles.inputWithIcon, // Add padding for icon
            inputStyle
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
        <Text style={[styles.errorText, errorStyle]}>
          {localError || errorMessage}
        </Text>
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
  required: {
    color: "#e74c3c",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 65,
    fontSize: 14,
    width: 320,
    backgroundColor: "#E9E6EE",
    fontFamily: 'Poppins_400Regular'
  },
  inputWithIcon: {
    paddingRight: 50, // Make room for the toggle icon
  },
  inputFocused: {
    borderColor: "#7851A9",
    borderWidth: 1,
  },
  inputError: {
    borderColor: "#e74c3c",
    borderWidth: 2,
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
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});