import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Pressable, Image, ActivityIndicator } from "react-native";
import ThemedText from '../../components/ThemedText';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEvent } from "../../context/EventContext";
import { Ionicons } from "@expo/vector-icons";
import useThemeColors from "../hooks/useThemeColors";
import { StatusBar } from "expo-status-bar";
import { formatDateTime } from "../../utils/formatDateTime";
import AnimatedButton from "../../components/AnimatedButton";
import { useAuth } from "../../context/AuthContext";
//import { checkBiometricAvailability } from "../utils/checkBioAvailability";
import users from "../../data/users.json";
import * as Location from "expo-location";

interface User {
  id: string;
  name: string;
}

export default function EventDetails() {
  const [isCreator, setIsCreator] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [location, setLocation] = useState<[number, number]>([0, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { id, isValid } = useLocalSearchParams();
  const { user } = useAuth();
  const { events } = useEvent();
  const router = useRouter();
  const theme = useThemeColors();

  const event = events.find(e => e.id === id);

  const styles = useMemo(() => StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background || '#fff' 
    },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 15, 
      paddingHorizontal: 20, 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee',
      justifyContent: 'space-between',
      marginTop: 30
    },
    backButton: { 
      padding: 2 
    },
    scrollContent: { 
      padding: 20, 
      paddingBottom: 50 
    },
    imageContainer: { 
      alignItems: 'center',
      marginBottom: 20
    },
    eventImage: { 
      width: 290, 
      height: 230, 
      borderRadius: 15, 
      resizeMode: 'cover' 
    },
    contentContainer: {
      gap: 15
    },
    title: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: theme.text,
      textAlign: 'center'
    },
    description: { 
      fontSize: 14, 
      color: theme.text, 
      lineHeight: 22,
      textAlign: 'center'
    },
    dateTime: { 
      fontSize: 14, 
      color: theme.primary, 
      fontWeight: '600',
      textAlign: 'center'
    },
    infoSection: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      gap: 12
    },
    infoRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      paddingVertical: 8
    },
    chatRoomRow: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      marginTop: 8
    },
    label: { 
      color: theme.text,
      fontSize: 14,
      flex: 1
    },
    value: { 
      color: theme.text,
      fontSize: 14,
      flex: 2,
      textAlign: 'right'
    },
    buttonContainer: {
      alignItems: 'center',
      marginTop: 24
    }
  }), [theme]);

    useEffect(() => {
      (async () => {
        if (!event?.isTrackingAttendance || event.eventType !== "physical") {
          setLoading(false);
          return;
        }

        console.log('🗺️ MapPage: Requesting location permissions...');
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('🗺️ MapPage: Permission status:', status);
        
        if (status !== "granted") {
          console.error('❌ MapPage: Location permission denied');
          setErrorMsg("Permission denied");
          setLoading(false);
          return;
        }
  
        console.log('🗺️ MapPage: Getting current position...');
        let location = await Location.getCurrentPositionAsync({});
        console.log('📍 MapPage: Current location acquired:', {
          longitude: location.coords.longitude,
          latitude: location.coords.latitude,
          accuracy: location.coords.accuracy
        });
        
        setLocation([location.coords.longitude, location.coords.latitude]);
        setLoading(false);
      })();
    }, []);

  // Helper function to get user name by ID
  const getUserNameById = (userId: string): string => {
    const foundUser = users.find((u: User) => u.id === userId);
    return foundUser?.name || `User ${userId}`;
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Check if current user is creator or cohost
  useEffect(() => {
      console.log('All events:', events);
  console.log('Current user ID:', user?.id);
  }, [events])
  useEffect(() => {
    if (user?.id && event) {
      const isEventCreator = event.creator === user.id;
      const isCohost = event.cohosts.includes(user.id);
      setIsCreator(isEventCreator || isCohost);
      
      // For now, simulate registration status (in real app, this would come from backend)
      // If user is not creator/cohost, they could be registered
      if (!isEventCreator && !isCohost) {
        // Simulate some users being registered
        setIsRegistered(Math.random() > 0.5);
      }
    }
  }, [user?.id, event]);

  // Handle check-in status from URL params
  useEffect(() => {
    if (isValid === 'true') {
      setIsCheckedIn(true);
    }
  }, [isValid]);

  const handleEdit = () => {
    if (isCreator && event) {
      // Navigate to edit event
      router.push({
        pathname: `/${event.eventType}-events`,
        params: {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          date: event.date,
          time: event.time,
          cohosts: JSON.stringify(event.cohosts),
          eventFee: event.eventFee,
        },
      });
    } else {
      
      setIsRegistered(true);
    }
  };

  const handleCheckIn = () => {
    //TODO: Check if user is in area.
    //This shall exist with a watered down ray casting algo.
    //TODO: Check if user's device has fingerprint sensor.
    if (event?.isTrackingAttendance && event.eventType === "physical") {
      const inArea = checkUserAttendance();
  if (!inArea) {
        // User is NOT in the area
        alert("You must be within the event boundaries to check in!");
        return;
      }
    router.push('/check-in/pinEntry');
    } 
  }

  function checkUserAttendance() {
  const userLocation: [number, number] = location;
  const [lon, lat] = userLocation;

  if (!event?.geoPolygon || event.geoPolygon.length < 3) {
    return false;
  }

  let isInside = false;
  const polygon = event.geoPolygon;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    // Check if horizontal ray from point crosses this edge
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
}
    /*
  const handleRegistration = async () => {
    try {
      router.push('/check-in/pinEntry');
      const biometricsAvailable = await checkBiometricAvailability();
      if (biometricsAvailable) {
        router.push('/check-in/decision');
      } else {
        router.push('/check-in/pinEntry');
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
      router.push('/check-in/pinEntry');
    }
  };
  */
  function handleAlreadyCheckedIn() {
    console.log("You checked in already")
  }

  function handleButtonPress() {
    if (isCheckedIn) {
      handleAlreadyCheckedIn()
    }
    else if(isRegistered) {
      handleCheckIn()
    }
    else if(isCreator) {
      handleEdit()
    }
  }
  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="calendar-outline" size={64} color={theme.text} />
          <ThemedText weight="semibold" style={{ fontSize: 18, marginTop: 16, color: theme.text }}>
            Event not found
          </ThemedText>
          <ThemedText weight="regular" style={{ fontSize: 14, color: theme.text, marginTop: 8 }}>
            This event may have been deleted or is no longer available.
          </ThemedText>
          <AnimatedButton 
            width={120} 
            onPress={() => router.push("/events")}
            buttonStyles={{ marginTop: 20 }}
          >
            Go Back
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  // Get host names
  const creatorName = getUserNameById(event.creator || '');
  const cohostNames = event.cohosts
    .map(id => getUserNameById(id))
    .filter(name => name !== creatorName); // Don't duplicate creator in cohosts

  const allHosts = cohostNames.length > 0 
    ? `${creatorName}, ${cohostNames.join(', ')}`
    : creatorName;

    if (loading && event?.isTrackingAttendance && event.eventType === "physical") {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText weight="regular" style={{ marginTop: 16 }}>
          Getting your location...
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

// Also add this check:
if (errorMsg && event?.isTrackingAttendance && event.eventType === "physical") {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="location-outline" size={64} color={theme.text} />
        <ThemedText weight="semibold" style={{ fontSize: 18, marginTop: 16 }}>
          Location Access Required
        </ThemedText>
        <ThemedText weight="regular" style={{ textAlign: 'center', marginTop: 8 }}>
          {errorMsg}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}


  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <ThemedText weight="semibold" style={{ color: theme.primary, fontSize: 16 }}>
            {capitalizeFirstLetter(event.eventType)} Event
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Image */}
          <View style={styles.imageContainer}>
            <Image
                    source={event.imageUrl ? { uri: event.imageUrl } : undefined}
                    style={styles.eventImage}
                  />
          </View>
          
          <View style={styles.contentContainer}>
            {/* Event Title */}
            <ThemedText weight="bold" style={styles.title}>
              {event.title}
            </ThemedText>

            {/* Event Description */}
            <ThemedText weight="regular" style={styles.description}>
              {event.description}
            </ThemedText>
            
            {/* Date and Time */}
            <ThemedText weight="semibold" style={styles.dateTime}>
              {formatDateTime(event.date, event.time)}
            </ThemedText>

            {/* Event Information */}
            <View style={styles.infoSection}>
              {/* Location */}
              <View style={styles.infoRow}>
                <ThemedText weight="semibold" style={styles.label}>Location:</ThemedText>
                <ThemedText weight="regular" style={styles.value}>
                  {event.location || "Not specified"}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText weight="semibold" style={styles.label}>Hosted by:</ThemedText>
                <ThemedText weight="regular" style={styles.value}>
                  {allHosts}
                </ThemedText>
              </View>

              {/* Event Fee */}
              {event.eventFee !== undefined && (
                <View style={styles.infoRow}>
                  <ThemedText weight="semibold" style={styles.label}>Fee:</ThemedText>
                  <ThemedText weight="regular" style={styles.value}>
                    {event.eventFee === "0" || event.eventFee === "" ? "Free" : `$${event.eventFee}`}
                  </ThemedText>
                </View>
              )}

              {/* Registered Participants - Mock data for now */}
              <View style={styles.infoRow}>
                <ThemedText weight="semibold" style={styles.label}>Registered:</ThemedText>
                <ThemedText weight="regular" style={styles.value}>
                  {Math.floor(Math.random() * 50) + 1}
                </ThemedText>
              </View>

              {/* Attendance Number - Mock data for now */}
              <View style={styles.infoRow}>
                <ThemedText weight="semibold" style={styles.label}>Attended:</ThemedText>
                <ThemedText weight="regular" style={styles.value}>
                  {Math.floor(Math.random() * 30) + 1}
                </ThemedText>
              </View>

              {/* Chat Room */}
              <View style={styles.chatRoomRow}>
                <ThemedText weight="semibold" style={styles.label}>Chat Room</ThemedText>
                <AnimatedButton 
                  bgcolor={theme.primary} 
                  width={80} 
                  onPress={() => router.push('/chat')} 
                  fontSize={11} 
                  buttonStyles={{ height: 40 }}
                >
                  Chat
                </AnimatedButton>
              </View>
            </View>
          </View>

          {/* Main Action Button */}
          <View style={styles.buttonContainer}>
            <AnimatedButton
              width={200}
              onPress={handleButtonPress}
              bgcolor={theme.primary}
            >
              {isCreator ? "Edit Event" : isCheckedIn? "Done": isRegistered ? "Check In" :  "Register"}
            </AnimatedButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}