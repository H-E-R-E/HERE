import React, { useRef } from "react";
import { Animated, Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';

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
  buttonStyle?: ViewStyle | ViewStyle[];
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
  buttonStyle
}: AnimatedButtonProps) {
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
        { 
          backgroundColor: bgcolor || "#7851A9", 
          width: width, 
          borderColor: borderColor, 
          borderWidth: 0 || borderWidth 
        },
        buttonStyle
      ]}
    >
      <Text style={[styles.text, { color: color || "#FFFFFF" }]}>{children}</Text>
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
    paddingTop: 20
    
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  }
});
