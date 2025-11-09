import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, SafeAreaView, Pressable, Modal } from "react-native";
import InputField from "../../components/InputField";
import DateTimeSelector from "../../components/DateTimeSelector";
import FormPressable from "../../components/FormPressable";
import ImageAdder from "../../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import users from "../../data/users.json";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../../components/AnimatedButton";
import useThemeColors from "../hooks/useThemeColors";
import { useEvent } from "../../context/EventContext";
import ThemedText from "../../components/ThemedText";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/AuthContext";
import CentralModal from "../../components/CentralModal";

export default function PhysicalEvent() {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
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


  useEffect(() => {
    if (physicalEvent.startDate) {
      const contextDate = new Date(physicalEvent.startDate);
      contextDate.setHours(0, 0, 0, 0);
      setSelectedStartDate(contextDate);
    }

    if (physicalEvent.startTime) {
      const [hours, minutes] = physicalEvent.startTime.split(':').map(Number);
      const contextTime = new Date(0);
      contextTime.setHours(hours, minutes, 0, 0);
      setSelectedStartTime(contextTime);
    }

    if (physicalEvent.endDate) {
      const contextDate = new Date(physicalEvent.endDate);
      contextDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(contextDate);
    }

    if (physicalEvent.endTime) {
      const [hours, minutes] = physicalEvent.endTime.split(':').map(Number);
      const contextTime = new Date(0);
      contextTime.setHours(hours, minutes, 0, 0);
      setSelectedEndTime(contextTime);
    }

   
    setIsEventFeeEnabled(!!physicalEvent.eventFee && physicalEvent.eventFee.length > 0);
  }, [physicalEvent.startDate, physicalEvent.startTime, physicalEvent.eventFee]);

  useEffect(() => {
    setIsFormValid(
      !!physicalEvent.title &&
      !!physicalEvent.startDate &&
      !!physicalEvent.endDate &&
      !!physicalEvent.startTime &&
      !!physicalEvent.endTime &&
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
    startDate: params.startDate as string,
    startTime: params.startTime as string,
    endDate: params.endDate as string,
    endTime: params.endTime as string,
    cohosts: params.cohosts ? JSON.parse(params.cohosts as string) : [],
    eventFee: params.eventFee as string,
  });

}, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background, },
        scrollContent: { flexGrow: 1, backgroundColor: theme.background },

        primaryView: { 
          flex: 1, 
          alignItems: "center", 
          marginVertical: 50 
        },

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
      router.push("/(tabs)");
  };

  const handleSubmit = () => {
  if (!isFormValid) return;

  const finalEvent = {
    ...physicalEvent,
    eventType: "physical" as const,
    creator: user?.id,
    imageUrl: physicalEvent.imageUrl 
  };
  
  const existingEventIndex = events.findIndex(e => e.id === physicalEvent.id);
  
  if (existingEventIndex >= 0) {
    updateEvent(physicalEvent.id, finalEvent);
  } else {
    addEvent(finalEvent);
  }

  // for reset
  setTimeout(() => {
    updatePhysicalEvent({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      eventFee: "",
      cohosts: [],
      imageUrl: "",
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    });

    setSelectedStartDate(null);
    setSelectedStartTime(null);
    setSelectedEndDate(null);
    setSelectedEndTime(null);
    setDisplayLocation("");
    setIsEventFeeEnabled(false);
    setIsAttendanceTrackingEnabled(false);
  }, 100);

  router.replace("/events");
};

//TODO: fucking polish this up, man, it's not as functional as intended.
const handleDateChange = (d: Date | null, isStart: boolean) => {
  if (d) {
    const onlyDate = new Date(d);
    onlyDate.setHours(0, 0, 0, 0);
    
    if (isStart) {
      setSelectedStartDate(onlyDate);
      if (!selectedEndDate || selectedEndDate < onlyDate) {
        setSelectedEndDate(onlyDate);
      }
    } else {
      setSelectedEndDate(onlyDate);
    }
    
    const dateStr = onlyDate.toISOString().slice(0, 10);
    isStart 
      ? updatePhysicalEvent({ startDate: dateStr }) 
      : updatePhysicalEvent({ endDate: dateStr });
  }
};

const handleTimeChange = (d: Date | null, isStart: boolean) => {
  if (d) {
    const onlyTime = new Date(0);
    onlyTime.setHours(d.getHours(), d.getMinutes(), 0, 0);
    
    if (isStart) {
      setSelectedStartTime(onlyTime);
      if (!selectedEndTime || selectedEndTime < onlyTime) {
        setSelectedEndTime(onlyTime);
      }
    } else {
      setSelectedEndTime(onlyTime);
    }
    
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    isStart 
      ? updatePhysicalEvent({ startTime: `${hh}:${mm}` })
      : updatePhysicalEvent({ endTime: `${hh}:${mm}` });
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
    backgroundColor: theme.inputBgColor,
    borderWidth: 0,
    fontSize: 13,
    color: hasValue ? theme.text : '#00000059',
  });

  function handleSetLocation() {
    setAttendanceTrackingModal(false);
    router.push({
      pathname: "/mappage",
      params: { setLocation: physicalEvent.location }
    })
  }

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
              <ThemedText style={styles.headerText}>Create a Physical Event</ThemedText>
            </View>

            <ImageAdder onImageSelected={(uri) => updatePhysicalEvent({ imageUrl: uri })} />
            <InputField
              placeholder="Event Name"
              value={physicalEvent.title}
              onChangeText={(text) => updatePhysicalEvent({ title: text })}
              inputType="default"
              inputStyle={getInputStyle(!!physicalEvent.title)}
              iconName={"pencil-sharp"}
              showAnyIcon
            />

            <View style={styles.dateTimeContainer}>
             <View style={styles.dateContainer}>
            <DateTimeSelector
              mode="date"
              value={selectedStartDate}
              onChange={(d) => handleDateChange(d, true)}
              placeholder="Start Date"
              iconName={"calendar-outline"}
            />

            <DateTimeSelector
              mode="date"
              value={selectedEndDate}
              onChange={(d) => handleDateChange(d, false)}
              placeholder="End Date"
              iconName={"calendar-outline"}
            />


        </View>
            </View>

          <View style={styles.dateTimeContainer}>
             <View style={styles.dateContainer}>
            <DateTimeSelector
              mode="time"
              value={selectedStartTime}
              onChange={(d) => handleTimeChange(d, true)}
              placeholder="Start Time"
              iconName={"time-outline"}
            />

            <DateTimeSelector
              mode="time"
              value={selectedEndTime}
              onChange={(d) => handleTimeChange(d, false)}
              placeholder="End Time"
              iconName={"time-outline"}
            />
        </View>
      </View>



            <InputField
              placeholder="Description"
              value={physicalEvent.description}
              onChangeText={(text) => updatePhysicalEvent({ description: text })}
              inputType="default"
              inputStyle={[getInputStyle(!!physicalEvent.description)]}
              multiline
              showAnyIcon
              iconName={"pencil-sharp"}
              

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
              showLeftIcon
              leftIconName="location-outline"
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
              showLeftIcon
              leftIconName="people-outline"
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
              hasValue={isEventFeeEnabled && !!physicalEvent.eventFee}
              showLeftIcon
              leftIconName="cash-outline"
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
              showLeftIcon
              leftIconName="wallet-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable 
              label="Track Attendance" 
              onPress={() => {}} 
              width={320}
              showLeftIcon
              leftIconName="person-add-outline"
            >
              <Switch
                trackColor={{ false: "#9f9f9f", true: theme.primary }}
                thumbColor={isAttendanceTrackingEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => {
                  if (physicalEvent.isTrackingAttendance) {
                    updatePhysicalEvent({ isTrackingAttendance: false })
                  } else {
                    setAttendanceTrackingModal(true);
                  }
                }}
                value={physicalEvent.isTrackingAttendance}
                
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
            
            <CentralModal
              isVisible={eventFeeModal}
              onClose={handleModalClose}
               headerText="Event Fee"
                headerButtonIcon="close" 
                onHeaderButtonPress={handleModalClose}
                animationType='slide'
            >
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
            </CentralModal>

            <CentralModal
                isVisible={attendanceTrackingModal}
                onClose={() => setAttendanceTrackingModal(false)}
               headerText="Set Attendance"
                headerButtonIcon="close" 
                onHeaderButtonPress={() => setAttendanceTrackingModal(false)}
            >
                    <View style={{ width: 270 }}>
                     <ThemedText weight="semibold" style={{ textAlign: 'center', color: theme.primary, fontSize: 13 }}>To enable attendance tracking you need to set location parameters</ThemedText> 
                    </View>
                    
                    <AnimatedButton onPress={handleSetLocation} width={200}>Set Parameters</AnimatedButton>
              

            </CentralModal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}