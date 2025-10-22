import React, { useState, useMemo } from "react";
import type { ComponentProps } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../app/hooks/useThemeColors";
import ThemedText from './ThemedText';
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
  showAnyIcon?: boolean;
  iconName?: IoniconName;
  onSearchPress?: () => void;
  onSwitchPress?: () => void;
  onClick?: () => void;
  showSwitchButton?: boolean;
  multiline?: boolean
}

type IoniconName = ComponentProps<typeof Ionicons>['name'];

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
  showSwitchButton = false,
  showAnyIcon = false,
  iconName = "heart",
  onSearchPress,
  onSwitchPress,
  onClick,
  multiline,
  ...textInputProps
}: InputFieldProps) {

  const [localError, setLocalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const theme = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 65,
    fontSize: 13,
    width: 320,
    backgroundColor: theme.inputBgColor,
    fontFamily: 'Poppins',
    color: theme.text,
  },
  inputWithLeftIcon: {
    paddingLeft: 45,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputFocused: {
    borderColor: theme.primary,
    borderWidth: 1,
  },
  inputError: {
    borderColor: theme.warning,
    borderWidth: 1,
    backgroundColor: "#FFF5F5",
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    color: theme.warning,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
    fontFamily: 'Poppins',
  },
}), [theme]);

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
        
        {showAnyIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={iconName || "heart"}
              size={18}
              color={value && value?.length > 0 ? theme.text : theme.placeholderText}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            showAnyIcon && styles.inputWithLeftIcon,
            isFocused && styles.inputFocused,
            displayError && styles.inputError,
            (shouldShowToggle || showSearchButton) && styles.inputWithIcon,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholderText}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPress={onClick}
          keyboardType={getKeyboardType()}
          autoComplete={getAutoCompleteType()}
          secureTextEntry={isSecureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
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

        {showSwitchButton && (
            <TouchableOpacity
              style={[styles.toggleButton, { right: showSearchButton ? 45 : 15 }]}
              onPress={onSwitchPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="swap-vertical"
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