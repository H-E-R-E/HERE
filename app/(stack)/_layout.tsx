import React from 'react';
import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="co-host" />
      <Stack.Screen name="eventdetails" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="mappage" />
      <Stack.Screen name="physical-events" />
      <Stack.Screen name="virtual-events" />
      <Stack.Screen name="select-location" />
    </Stack>
  );
}