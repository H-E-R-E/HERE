import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';
import ThemedText from './ThemedText';
import useThemeColors from "../app/hooks/useThemeColors";

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  bgcolor?: string;
  width: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  buttonStyles?: ViewStyle | ViewStyle[];
  fontSize?: number;
}

export default function AnimatedButton({ 
  onPress, 
  children, 
  bgcolor, 
  width, 
  color, 
  borderColor, 
  borderWidth, 
  disabled = false,
  style,
  buttonStyles,
  fontSize // Destructure fontSize
}: AnimatedButtonProps) {
  const theme = useThemeColors();
  const animation = useRef(new Animated.Value(0)).current;
  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  const onPressIn = (): void =>{
    Animated.spring(animation, {
      toValue: 0.5,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = (): void => {
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
  <Pressable
        style={[styles.btn, style]}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        onPress={disabled ? undefined : onPress}
      >
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ scale }]}, 
        disabled ? { opacity: 0.8 } : {},
        { 
          backgroundColor: bgcolor || theme.primary, 
          width: width, 
          borderColor: borderColor, 
          borderWidth: 0 || borderWidth 
        },
        buttonStyles
      ]}
    >
      <ThemedText weight="semibold" style={[styles.text, { color: color || "#FFFFFF", fontSize: fontSize || 16 }]}>{children}</ThemedText>
    </Animated.View>
  </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    height: 60,
  },
  btn: {
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "Poppins_400Regular",
    paddingVertical: 20
    
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  }
});

