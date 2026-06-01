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
      
      <Stack.Screen name="signin" />
      <Stack.Screen name="create-username" />
      <Stack.Screen name="otp-verify" />
    </Stack>
  );
}