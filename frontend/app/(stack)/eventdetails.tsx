import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Pressable, Image, ActivityIndicator } from "react-native";
import ThemedText from '../../components/ThemedText';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useThemeColors from "../hooks/useThemeColors";
import { StatusBar } from "expo-status-bar";
import AnimatedButton from "../../components/AnimatedButton";
import CentralModal from "../../components/CentralModal";
import { useAuth } from "../../context/AuthContext";
import * as Location from "expo-location";
import { useGetEvent } from "../services/get-event.service";
import { useRsvpEvent, useCheckInEvent, useCheckRsvpStatus } from "../services/event-actions.service";
import type { AxiosError } from "axios";
import { ensureScope } from "../../utils/ensureScope";
import { useSwitchScope } from "../services/switch-scope.service";
import { useEvent } from "../../context/EventContext";
import { AppEvent } from "../../types/EventTypes";

interface ErrorDetail {
  msg: string;
  [key: string]: any;
}

interface ApiErrorResponse {
  detail?: ErrorDetail[] | string;
  message?: string;
  [key: string]: any;
}

export default function EventDetails() {
  const { id, type, isValid } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useThemeColors();

  const { data: event, isLoading: isEventLoading, isError } = useGetEvent(
    type as string, 
    id as string
  );

  console.log("Event endpoint response:", event);

  const [isCreator, setIsCreator] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([0, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const { mutate: rsvpToEvent, isPending: isRsvpLoading } = useRsvpEvent(type as string, id as string);
  const { mutate: checkInToEvent, isPending: isCheckInLoading } = useCheckInEvent(type as string, id as string);
    const { mutateAsync: switchScope } = useSwitchScope();
    const { updateEditPhysicalEvent, updateEditVirtualEvent } = useEvent();

    const { data: rsvpStatus, isLoading: isRsvpStatusLoading } = useCheckRsvpStatus(
      type as string,
      id as string
    );

  const styles = useMemo(() => StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background || '#fff' 
    },
    scrollContent: {
      paddingBottom: 50,
    },
    imageContainer: {
      width: "100%",
      height: 240,
      position: "relative",
      marginBottom: 20,
    },
    eventImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
      backgroundColor: theme.surface,
    },
    imageOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
      backgroundColor: "transparent",
    },
    backButton: {
      position: "absolute",
      top: 32,
      left: 16,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    eventTypeBadge: {
      position: "absolute",
      top: 32,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(0,0,0,0.4)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    eventTypeBadgeText: {
      color: "#fff",
      fontSize: 11,
    },
    dateChip: {
      position: "absolute",
      bottom: 14,
      left: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.4)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    dateChipText: {
      color: "#fff",
      fontSize: 12,
    },
      contentContainer: { 
        gap: 8
      },
      bodyContainer: {
        paddingHorizontal: 20,
      },
    title: {
      fontSize: 22,
      color: theme.text,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 18,
    },
    sectionLabel: {
      fontSize: 11,
      color: theme.text,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: "row",
      backgroundColor: theme.surface,  
      borderRadius: 8,
      paddingVertical: 16,
      marginBottom: 18,
      alignItems: "center",
    },
    statChip: {
      flex: 1,
      alignItems: "center",
    },
    statDivider: {
      width: 1,
      height: "100%",
      backgroundColor: theme.bottomTabBorderColor,
    },
    statValue: {
      fontSize: 14,
      color: theme.text,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    detailsCard: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.bottomTabBorderColor,
      overflow: "hidden",
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    chatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    detailRowDivider: {
      height: 1,
      backgroundColor: theme.bottomTabBorderColor,
    },
    detailIconBox: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.bottomTabBorderColor,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    detailText: {
      flex: 1,
      gap: 2,
    },
    detailLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      textTransform: "uppercase",
    },
    detailValue: {
      fontSize: 13,
      color: theme.text,
    },
    chatPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chatPillText: {
      fontSize: 12,
      color: theme.primary,
    },
    buttonContainer: { 
      alignItems: 'center', 
      marginTop: 24 
    },

    }), [theme]);


  useEffect(() => {
    (async () => {
      if (type !== "physical") {
        setLocationLoading(false);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        console.log("Location permission denied");
        setErrorMsg("Permission denied");
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log("User location found - Longitude:", location.coords.longitude, "Latitude:", location.coords.latitude);
      setUserLocation([location.coords.longitude, location.coords.latitude]);
      setLocationLoading(false);
    })();
  }, [type]);

  useEffect(() => {
  if (rsvpStatus) {
    setIsRegistered(rsvpStatus.rsvp_exists);
  }
}, [rsvpStatus]);

  // Very important, check if the user is the host.
  useEffect(() => {
    if (user?.id && event) {
      const isCreatorCheck = event.host_id.toString() === user.id.toString();
      setIsCreator(isCreatorCheck);
      console.log("User ID:", user.id, "Event host ID:", event.host_id, "Is creator:", isCreatorCheck);
      
        //build event edit thing
        const builtEvent: AppEvent = {
          attendance_profile: event.attendance_profile as "quick" | "standard" | "extended" | "unlimited",
          category: event.category,
          description: event.description,
          end_time: event.end_time,
          geofence_radius: event.geofence_radius,
          latitude: event.latitude,
          longitude: event.longitude,
          name: event.name,
          recurrence: null,
          start_time: event.start_time,
          visibility: event.visibility as "Public" | "Private"

        }
      if (isCreatorCheck && type === "physical") {
        updateEditPhysicalEvent(builtEvent)
      }
      if (isCreatorCheck && type === "virtual") {
        updateEditVirtualEvent(builtEvent)
      }
    }
  }, [user?.id, event]);

  useEffect(() => {
    if (isValid === 'true') {
      setIsCheckedIn(true);
    }
  }, [isValid]);

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleEdit = () => {
    if (isCreator && event) {
      router.push({
        pathname: `/${type}-events`,
        params: { id: event.id },
      });
    }
  };


const handleRegistration = async() => {
    await ensureScope('access', switchScope);
    rsvpToEvent(undefined, {
      onSuccess: (data) => {
        alert(data.message || "Successfully registered!");
        setIsRegistered(true);
      },
      onError: (err) => {
        const error = err as AxiosError<ApiErrorResponse>;
        const errorMsg = Array.isArray(error.response?.data?.detail)
          ? error.response.data.detail[0]?.msg
          : typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : error.response?.data?.message || "Failed to register";
        alert(errorMsg);
      }
    });
  };

  const handleCheckIn = async() => {
    await ensureScope('access', switchScope);
    if (type === "physical") {
      checkInToEvent({
        verify_location: true,
        longitude: userLocation[0],
        latitude: userLocation[1]
      }, {
        onSuccess: (data) => {
          setCheckInMessage(data.message || "Successfully checked in!");
          setShowCheckInModal(true);
          setIsCheckedIn(true);
        },
        onError: (err) => {
          const error = err as AxiosError<ApiErrorResponse>;
          const errorMsg = Array.isArray(error.response?.data?.detail)
            ? error.response.data.detail[0]?.msg
            : typeof error.response?.data?.detail === 'string'
            ? error.response.data.detail
            : error.response?.data?.message || "Check-in failed. Are you at the venue?";
          alert(errorMsg);
        }
      });
    } else {
      setCheckInMessage("Successfully checked in!");
      setShowCheckInModal(true);
      setIsCheckedIn(true);
    }
  };

  function handleAlreadyCheckedIn() {
    console.log("You checked in already");
  }

  function handleButtonPress() {
    if (isCheckedIn) handleAlreadyCheckedIn();
    else if(isRegistered) handleCheckIn();
    else if(isCreator) handleEdit();
    else handleRegistration(); 
  }

  const formattedStartTime = event ? new Date(event.start_time).toLocaleString("en-NG", {
    dateStyle: "medium", timeStyle: "short"
  }) : "";

  
  const formattedEndTime = event ? new Date(event.end_time).toLocaleString("en-NG", {
  dateStyle: "medium", timeStyle: "short"
}) : "";

  if (isEventLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText weight="regular" style={{ marginTop: 16 }}>Loading Event Details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="calendar-outline" size={64} color={theme.text} />
          <ThemedText weight="semibold" style={{ fontSize: 18, marginTop: 16, color: theme.text }}>Event not found</ThemedText>
          <AnimatedButton width={120} onPress={() => router.push("/events")} buttonStyles={{ marginTop: 20 }}>
            Go Back
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  if ((locationLoading || isRsvpStatusLoading) && type === "physical") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText weight="regular" style={{ marginTop: 16 }}>Getting your location...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (isRsvpStatusLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText weight="regular" style={{ marginTop: 16 }}>Loading Event Details...</ThemedText>
      </View>
    </SafeAreaView>
  );
}


  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <SafeAreaView style={styles.container}>
        <CentralModal
          isVisible={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          headerText="Check-In Confirmation"
          headerButtonIcon="close"
          onHeaderButtonPress={() => setShowCheckInModal(false)}
        >
          <View style={{ alignItems: 'center', gap: 20 }}>
            <Ionicons name="checkmark-circle" size={64} color={theme.primary} />
            <ThemedText weight="semibold" style={{ fontSize: 16, textAlign: 'center', color: theme.text }}>
              {checkInMessage}
            </ThemedText>
            <AnimatedButton
              width={150}
              onPress={() => setShowCheckInModal(false)}
              bgcolor={theme.primary}
            >
              Done
            </AnimatedButton>
          </View>
        </CentralModal>



        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={require("../../assets/event-placeholder.jpeg")} 
            style={styles.eventImage} 
          />
          {/* Gradient overlay at bottom of image */}
          <View style={styles.imageOverlay} />
          
          {/* Back button top-left */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          {/* Event type badge top-right */}
          <View style={styles.eventTypeBadge}>
            <Ionicons 
              name={type === "physical" ? "location-outline" : "videocam-outline"} 
              size={13} 
              color="#fff" 
            />
            <ThemedText weight="semibold" style={styles.eventTypeBadgeText}>
              {capitalizeFirstLetter(type as string)}
            </ThemedText>
          </View>

          {/* Date chip bottom-left */}
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={13} color="#fff" />
            <ThemedText weight="semibold" style={styles.dateChipText}>
              {formattedStartTime}
            </ThemedText>
          </View>
        </View>
        <View style={styles.bodyContainer}>
          <ThemedText weight="bold" family="source" style={styles.title}>{event.name}</ThemedText>
          <ThemedText weight="regular" style={styles.description}>{event.description}</ThemedText>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
          <ThemedText weight="semibold" style={styles.statValue}>{event.rsvp_count}</ThemedText>
          <ThemedText weight="regular" style={styles.statLabel}>Registered</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Ionicons name="eye-outline" size={18} color={theme.textSecondary} />
          <ThemedText weight="semibold" style={styles.statValue}>
            {capitalizeFirstLetter(event.visibility)}
          </ThemedText>
          <ThemedText weight="regular" style={styles.statLabel}>Visibility</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Ionicons name="ribbon-outline" size={18} color={theme.textSecondary} />
          <ThemedText weight="semibold" style={styles.statValue}>
            {capitalizeFirstLetter(event.attendance_profile)}
          </ThemedText>
          <ThemedText weight="regular" style={styles.statLabel}>Profile</ThemedText>
        </View>
      </View>

    {/* Details Section Label */}
    <ThemedText weight="semibold" style={styles.sectionLabel}>Details</ThemedText>

    {/* Details Card */}
    <View style={styles.detailsCard}>
      
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name="pricetag-outline" size={15} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText weight="regular" style={styles.detailLabel}>Category</ThemedText>
        <ThemedText weight="semibold" style={styles.detailValue}>{event.category}</ThemedText>
      </View>
    </View>

    <View style={styles.detailRowDivider} />

    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name="person-circle-outline" size={15} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText weight="regular" style={styles.detailLabel}>Hosted by</ThemedText>
        <ThemedText weight="semibold" style={styles.detailValue}>{event.host_name}</ThemedText>
      </View>
    </View>

    <View style={styles.detailRowDivider} />

    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText weight="regular" style={styles.detailLabel}>Start time</ThemedText>
        <ThemedText weight="semibold" style={styles.detailValue}>{formattedStartTime}</ThemedText>
      </View>
    </View>

    <View style={styles.detailRowDivider} />

    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText weight="regular" style={styles.detailLabel}>End time</ThemedText>
        <ThemedText weight="semibold" style={styles.detailValue}>{formattedEndTime}</ThemedText>
      </View>
    </View>

    <View style={styles.detailRowDivider} />

    {/* Chat Row */}
    <View style={styles.chatRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name="chatbubbles-outline" size={15} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText weight="regular" style={styles.detailLabel}>Event chat</ThemedText>
        <ThemedText weight="semibold" style={styles.detailValue}>Open to attendees</ThemedText>
      </View>
      <Pressable 
      style={styles.chatPill} 
      onPress={() => router.push({
        pathname: "/chat",
        params: {
          eventId: event.id,
          eventName: event.name
        },
      })}
      >
        <ThemedText weight="semibold" style={styles.chatPillText}>Join</ThemedText>
        <Ionicons name="arrow-forward" size={13} color={theme.primary} />
      </Pressable>
    </View>

  </View>

    <View style={styles.buttonContainer}>
    <AnimatedButton width={200} onPress={handleButtonPress} bgcolor={theme.primary}>
    {isCreator ? "Edit Event" : isCheckedIn ? "Done" : isRegistered ? "Check In" : "Register"}
    </AnimatedButton>
    </View>
    </View>
    </ScrollView>
  </SafeAreaView>
    </>
  );
}