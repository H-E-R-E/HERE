// app/(tabs)/_layout.tsx
import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CentralModal from '../../components/CentralModal';
import useThemeColors from "../hooks/useThemeColors"
import AnimatedButton from '../../components/AnimatedButton';
import ThemedText from '../../components/ThemedText';




export default function Layout() {
    const theme = useThemeColors();
    const TAB_BAR_HEIGHT = 60;
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    function handleGoToEvents(eventType: string) {
      setModalVisible(false);
      if (eventType === "physical") {
        router.push("/(stack)/physical-events")
      } else {
        router.push("/(stack)/virtual-events")
      }
    } 

    
  return (
    <>
    <Tabs
        screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.primary,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: theme.background,
          borderTopWidth: 0.5,
          borderColor: theme.bottomTabBorderColor,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarIconStyle: {
          
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "search" : "search-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="create"
        options= {{ title: "Open Modal",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "add" : "add-outline"} 
              size={focused ? size + 2 : size} 
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
            )
          }}
            listeners={{
              tabPress: e => {
            e.preventDefault();
            setModalVisible(true);
          }
        }}
  />
      
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "calendar" : "calendar-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "notifications" : "notifications-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>

        {modalVisible ? 
           <CentralModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        headerText="What Type?"
        headerButtonIcon="close" 
        onHeaderButtonPress={() => setModalVisible(false)}
        animationType='fade'
      >
         <AnimatedButton
                    onPress={() => handleGoToEvents("physical")}
                    width={250}
                  >
                    Physical
                  </AnimatedButton>
        
                  <ThemedText weight="regular" style={{ color: theme.primary, textAlign: 'center' }}>OR</ThemedText>
        
                  <AnimatedButton
                    onPress={() => handleGoToEvents("virtual")}
                    width={250}
                  >Virtual</AnimatedButton>
        
      </CentralModal>: null
        }


        
        </>

  );
}
