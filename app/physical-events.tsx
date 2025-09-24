import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, SafeAreaView, Pressable, Modal } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import ImageAdder from "../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import users from ".././data/users.json";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../components/AnimatedButton";
import useThemeColors from "./hooks/useThemeColors";
import { useEvent } from "../context/EventContext";
import ThemedText from "../components/ThemedText";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";

export default function PhysicalEvent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [displayLocation, setDisplayLocation] = useState<string>("");
  const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
  const [eventFeeModal, setEventFeeModal] = useState(false);
  const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);
  const [attendanceTrackingModal, setAttendanceTrackingModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeColors();

  const { physicalEvent, updatePhysicalEvent, setIsPhysical, addEvent, updateEvent, events } = useEvent();
  const { user } = useAuth();

  useEffect(() => {
    setIsPhysical(true);
  }, []);

  // Initialize local state from context on mount
  useEffect(() => {
    // Initialize date from context
    if (physicalEvent.date) {
      const contextDate = new Date(physicalEvent.date);
      contextDate.setHours(0, 0, 0, 0);
      setSelectedDate(contextDate);
    }
    
    // Initialize time from context
    if (physicalEvent.time) {
      const [hours, minutes] = physicalEvent.time.split(':').map(Number);
      const contextTime = new Date(0);
      contextTime.setHours(hours, minutes, 0, 0);
      setSelectedTime(contextTime);
    }

    // Initialize event fee state
    setIsEventFeeEnabled(!!physicalEvent.eventFee && physicalEvent.eventFee.length > 0);
  }, [physicalEvent.date, physicalEvent.time, physicalEvent.eventFee]);

  useEffect(() => {
    setIsFormValid(
      !!physicalEvent.title &&
      !!physicalEvent.date &&
      !!physicalEvent.time &&
      !!physicalEvent.description &&
      !!physicalEvent.location
    );
  }, [physicalEvent]);

  useEffect(() => {
    const placeParam = params?.place as string | undefined;
    if (!placeParam) return;

    try {
      const parsed = JSON.parse(placeParam);
      if (typeof parsed === "string") {
        updatePhysicalEvent({ location: parsed });
        setDisplayLocation(parsed.length > 30 ? parsed.slice(0, 30) + "..." : parsed);
      }
    } catch (err) {
      console.error("Error parsing place param", err);
    }
  }, [params?.place, updatePhysicalEvent]);

  const truncate = (s: string, n = 30) => (s.length > n ? s.slice(0, n) + "..." : s);

  const cohostNames = (physicalEvent.cohosts ?? []).map((id) => {
    const match = (users as Array<{ id: string | number; name: string }>).find(
      (u) => String(u.id) === String(id)
    );
    return match?.name ?? String(id);
  });

useEffect(() => {
  if (!params.id) return;

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  updatePhysicalEvent({
    id,
    title: params.title as string,
    description: params.description as string,
    location: params.location as string,
    date: params.date as string,
    time: params.time as string,
    cohosts: params.cohosts ? JSON.parse(params.cohosts as string) : [],
    eventFee: params.eventFee as string,
  });

}, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        scrollContent: { flexGrow: 1 },
        primaryView: { flex: 1, alignItems: "center", marginVertical: 50 },
        header: {
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          paddingHorizontal: 20,
          marginBottom: 20,
        },
        backButton: { padding: 8 },
        headerText: {
          color: theme.primary,
          fontWeight: "800",
          fontSize: 20,
          flex: 1,
          textAlign: "center",
          marginRight: 40,
        },
        dateTimeContainer: { flexDirection: "row" },
        dateContainer: { marginVertical: 5, flexDirection: 'row', gap: 20 },
        switchContainer: { paddingVertical: 10 },
        submitButton: { marginTop: 20 },
        submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
        modalOverlay: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
        },
        modalContent: {
              paddingVertical: 30,
              backgroundColor: 'white',
              borderRadius: 10,
              alignItems: 'center',
              position: 'relative',
              height: 200,
              width: 280,
              alignContent: 'center'
        },
        modalHead: {
            alignItems: 'center',
            justifyContent: 'space-between', 
            flexDirection: 'row',
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#7851A91A',
            width: 280,
            paddingHorizontal: 10
        }
      }),
    [theme]
  );

  const handleBackPress = () => {
    router.back();
  };

const handleSubmit = () => {
  if (!isFormValid) return;

  const finalEvent = {
    ...physicalEvent,
    eventType: "physical" as const,
    creator: user?.id, // ← Fixed: Use ID instead of name
  };
  const existingEventIndex = events.findIndex(e => e.id === physicalEvent.id);
  
  if (existingEventIndex >= 0) {
    // Edit existing event

    updateEvent(physicalEvent.id, finalEvent);
  } else {
    addEvent(finalEvent);
  }

  // Reset form fields AFTER the event is added
  setTimeout(() => {
    updatePhysicalEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      eventFee: "",
      cohosts: [],
      // Reset ID to generate a new one for next event
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    });

    setSelectedDate(null);
    setSelectedTime(null);
    setDisplayLocation("");
    setIsEventFeeEnabled(false);
    setIsAttendanceTrackingEnabled(false);
  }, 100);

  router.replace("/events");
};

  const handleDateChange = (d: Date | null) => {
    if (d) {
      const onlyDate = new Date(d);
      onlyDate.setHours(0, 0, 0, 0);
      setSelectedDate(onlyDate);

      const dateStr = onlyDate.toISOString().slice(0, 10);
      updatePhysicalEvent({ date: dateStr });
    }
  };

  const handleTimeChange = (d: Date | null) => {
    if (d) {
      const onlyTime = new Date(0);
      onlyTime.setHours(d.getHours(), d.getMinutes(), 0, 0);
      setSelectedTime(onlyTime);

      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      updatePhysicalEvent({ time: `${hh}:${mm}` });
    }
  };

  function handleEventFeeToggle() {
    if (isEventFeeEnabled) {
      
      setIsEventFeeEnabled(false);
      updatePhysicalEvent({ eventFee: "" });
    } else {

      setEventFeeModal(true);
    }
  }

  function handleModalClose() {
    if (!physicalEvent.eventFee || physicalEvent.eventFee.length === 0) {
      setIsEventFeeEnabled(false);
    } else {
      setIsEventFeeEnabled(true);
    }
    setEventFeeModal(false);
  }

  const getInputStyle = (hasValue: boolean) => ({
    backgroundColor: '#E9E6EE',
    borderWidth: 0,
    fontSize: 13,
    color: hasValue ? '#000000' : '#00000059'
  });

  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.primaryView}>
            <View style={styles.header}>
              <Pressable style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="arrow-back" size={24} color={theme.primary} />
              </Pressable>
              <ThemedText style={styles.headerText}>Physical</ThemedText>
            </View>

            <ImageAdder />

            <InputField
              placeholder="Event Name"
              value={physicalEvent.title}
              onChangeText={(text) => updatePhysicalEvent({ title: text })}
              inputType="default"
              inputStyle={getInputStyle(!!physicalEvent.title)}
            />

            <View style={styles.dateTimeContainer}>
             <View style={styles.dateContainer}>
            <DateTimeSelector
              mode="date"
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="Date"
            />

            <DateTimeSelector
              mode="time"
              value={selectedTime}
              onChange={handleTimeChange}
              placeholder="Time"
            />
        </View>

            </View>

            <InputField
              placeholder="Description"
              value={physicalEvent.description}
              onChangeText={(text) => updatePhysicalEvent({ description: text })}
              inputType="default"
              inputStyle={getInputStyle(!!physicalEvent.description)}
            />

            <FormPressable
              label={
                physicalEvent.location
                  ? truncate(physicalEvent.location)
                  : displayLocation || "Location"
              }
              onPress={() => router.push("/select-location")}
              width={320}
              hasValue={!!(physicalEvent.location || displayLocation)}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable
              label={
                cohostNames.length > 0 ? cohostNames.join(", ") : "Add Co-host"
              }
              onPress={() => router.push("/co-host")}
              width={320}
              hasValue={cohostNames.length > 0}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable 
              label={
                isEventFeeEnabled && physicalEvent.eventFee 
                  ? `${physicalEvent.eventFee}` 
                  : 'Event Fee'
              } 
              onPress={() => {}} 
              width={320} 
              paddingVert={22}
              hasValue={isEventFeeEnabled && !!physicalEvent.eventFee}
            >
              <Switch
                trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                thumbColor={isEventFeeEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleEventFeeToggle}
                value={isEventFeeEnabled}
              />
            </FormPressable>

            <FormPressable 
              label="Connect Wallet" 
              onPress={() => router.push("/wallet")} 
              width={320} 
              paddingVert={22}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable 
              label="Track Attendance" 
              onPress={() => {}} 
              width={320} 
              paddingVert={22}
            >
              <Switch
                trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                thumbColor={isAttendanceTrackingEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setAttendanceTrackingModal(true)}
                value={isAttendanceTrackingEnabled}
              />
            </FormPressable>

            <View style={styles.submitButton}>
              <AnimatedButton 
                onPress={handleSubmit} 
                bgcolor={theme.primary} 
                width={200}
                disabled={!isFormValid}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </AnimatedButton>
            </View>
            
            <Modal transparent visible={eventFeeModal} animationType="slide" onRequestClose={handleModalClose}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHead}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14, marginLeft: 100 }}>Event Fee</Text>
                        <Pressable
                          onPress={handleModalClose}
                          hitSlop={10}
                           >
                          <Ionicons name="close" size={24} color="#333" />
                          </Pressable>
                          </View>
                  <InputField
                    value={physicalEvent.eventFee}
                    onChangeText={(text) => updatePhysicalEvent({eventFee: text})}
                    inputStyle={{ 
                      width: 215, 
                      marginTop: 15, 
                      backgroundColor: '#E9E6EE', 
                      borderWidth: 0,
                      color: physicalEvent.eventFee ? '#000000' : '#00000059'
                    }}
                    placeholder="Add Amount"
                  />
                </View>
              </View>
            </Modal>
            
           <Modal transparent visible={attendanceTrackingModal} animationType="slide" onRequestClose={() => setAttendanceTrackingModal(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {width: 300, height: 260}]}>
                    <View style={styles.modalHead}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14, marginLeft: 80 }}>Track Attendance</Text>
                        <Pressable
                          onPress={() => setAttendanceTrackingModal(false)}
                          hitSlop={10}
                           >
                          <Ionicons name="close" size={24} color="#333" />
                          </Pressable>
                          </View>
                  <View style={{ padding: 30 }}>
                    <Text style={{ textAlign: 'center', color: theme.primary, fontWeight: 600, fontSize: 13 }}>To enable attendance tracking you need to set location parameters</Text>
                    <AnimatedButton onPress={() => router.push("/mappage")} width={200}>Set Parameters</AnimatedButton>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}