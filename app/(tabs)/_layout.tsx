// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        
        options={{
          title: 'Home',
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#7851A9',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#7851A9',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
            <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#7851A9',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
            <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#7851A9',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
            <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#7851A9',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
