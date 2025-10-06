import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      
      <Stack.Screen name="signup" />
      <Stack.Screen name="pickinterests" />
      <Stack.Screen 
        name="interests" 
        options={{
          gestureEnabled: false, // Prevent swiping back from onboarding
        }}
      />

        <Stack.Screen 
        name="create-here-pin" 
        options={{
          gestureEnabled: false, // Prevent swiping back from onboarding
        }}
      />
    </Stack>
  );
}