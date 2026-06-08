import React, { useState, useEffect, useMemo, useRef } from "react";
import { Alert, ScrollView, Text, View, StyleSheet, Switch, SafeAreaView, Pressable, Modal, TouchableOpacity } from "react-native";
import InputField from "../../components/InputField";
import DateTimeSelector from "../../components/DateTimeSelector";
import FormPressable from "../../components/FormPressable";
import ImageAdder from "../../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AnimatedButton from "../../components/AnimatedButton";
import useThemeColors from "../hooks/useThemeColors";
import { useEvent } from "../../context/EventContext";
import ThemedText from "../../components/ThemedText";
import { StatusBar } from "expo-status-bar";
import { useSwitchScope } from "../services/switch-scope.service";
import CentralModal from "../../components/CentralModal";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { ensureScope } from "../../utils/ensureScope";
import { useLocalSearchParams } from "expo-router";
import { AppEvent } from "../../types/EventTypes";
import isEqual from "lodash/isEqual";
import { useUpdateEvent } from "../services/update-event.service";

const CATEGORIES = ["Conference", "Meetup", "Workshop", "Webinar", "Religious", "Social", "Business"];
const VISIBILITY_OPTIONS = ["Public", "Private"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];

const ATTENDANCE_PROFILES = [
  { id: "quick", label: "Quick", description: "15 minutes" },
  { id: "standard", label: "Standard", description: "30 minutes" },
  { id: "extended", label: "Extended", description: "60 minutes" },
  { id: "unlimited", label: "Unlimited", description: "No limit" },
];


export default function PhysicalEvent() {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
  const [eventFee, setEventFee] = useState("");
  const [eventFeeModal, setEventFeeModal] = useState(false);
  const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);
  const [attendanceTrackingModal, setAttendanceTrackingModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [attendanceProfileModal, setAttendanceProfileModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [attendanceProfile, setAttendanceProfile] = useState<"quick" | "standard" | "extended" | "unlimited">("standard");

  const router = useRouter();
  const theme = useThemeColors();
  const originalEvent = useRef<AppEvent | null>(null);

  const { physicalEvent, updatePhysicalEvent, setIsPhysical, addEvent, updateEditPhysicalEvent, editPhysicalEvent } = useEvent();
  const { mutateAsync: switchScope } = useSwitchScope();
  const { mutate: updateEvent } = useUpdateEvent("physical");
  const [isRecurrenceEnabled, setIsRecurrenceEnabled] = useState(false);
  const [recurrenceModal, setRecurrenceModal] = useState(false);
  const [recurrence, setRecurrence] = useState<{
    frequency: string;
    interval: number;
    days_of_week?: string[];
    end_date?: string;
    count?: number;
  } | null>(null);
const [stopType, setStopType] = useState<"end_date" | "count">("end_date");
const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
const [recurrenceCount, setRecurrenceCount] = useState("");

  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const formData = isEditMode ? editPhysicalEvent : physicalEvent;
  const updateForm = isEditMode ? updateEditPhysicalEvent : updatePhysicalEvent;
  useEffect(() => {
    setIsPhysical(true);
  }, []);

  useEffect(() => {
    if (formData.geofence_radius) {
      setIsAttendanceTrackingEnabled(true);
    }
  })


  
  useEffect(() => {
    if (formData.start_time) {
      const startDate = new Date(formData.start_time);
      const onlyDate = new Date(startDate);
      onlyDate.setHours(0, 0, 0, 0);
      setSelectedStartDate(onlyDate);
      setSelectedStartTime(startDate);
    }

    if (formData.end_time) {
      const endDate = new Date(formData.end_time);
      const onlyDate = new Date(endDate);
      onlyDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(onlyDate);
      setSelectedEndTime(endDate);
    }
  }, []);

  useEffect(() => {
  if (isEditMode) {
    originalEvent.current = { ...editPhysicalEvent };
  }
}, []);

  // Form validation
  useEffect(() => {
    const fieldsValid =
      !!formData.name &&
      !!formData.start_time &&
      !!formData.end_time &&
      !!formData.description &&
      !!formData.category &&
      !!formData.attendance_profile &&
      formData.longitude !== 0 &&
      formData.latitude !== 0;

    if (isEditMode) {
      const isDirty = !isEqual(formData, originalEvent.current);
      setIsFormValid(fieldsValid && isDirty);
    } else {
      setIsFormValid(fieldsValid);
    }
  }, [formData]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
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
        submitButton: { marginTop: 20 },
        submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
        modalContent: {
        },
        optionRow: {
          marginVertical: 8,
          paddingVertical: 4,
        },
        doneButton: {
          marginTop: 24,
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        },
        doneButtonText: {
          color: 'white',
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [theme]
  );

  const handleBackPress = () => {
    if (isEditMode) {
      router.back();
    } else {
    router.push("/(tabs)");
    }
  };

const handleSubmit = async () => {
  if (!isFormValid) return;
  try {
      if (isEditMode) {
        console.log("handleSubmit started - Preparing to update event");
        console.log("Event data:", { name: formData.name, category: formData.category });
        
        console.log("Ensuring host scope before event update");
        await ensureScope('host', switchScope);
        
        console.log("Scope verified, updating event on backend");
        updateEvent({
          eventId: Number(id),
          eventData: formData
        }, {
          onSuccess: (data) => {
            console.log("Event updated successfully!", data);
            router.back();
          },
          onError: (err) => {
            console.error("Failed to update event:", err.response?.data);
            alert("Failed to update event");
          }
        });
      } else {
    console.log("handleSubmit started - Preparing to create event");
    console.log("Event data:", { name: formData.name, category: formData.category });
    
    console.log("Ensuring host scope before event creation");
    await ensureScope('host', switchScope);
    
    console.log("Scope verified, adding event to backend");
    await addEvent(formData);
    
    console.log("Event created successfully, navigating to events page");
    router.replace("/events");
      }
  } catch (e) {
    console.error("Error in handleSubmit:", e);
  }
};

  const combineDateTime = (date: Date, time: Date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0
    );
  };

  const handleDateChange = (d: Date | null, isStart: boolean) => {
    if (!d) return;

    const onlyDate = new Date(d);
    onlyDate.setHours(0, 0, 0, 0);

    if (isStart) {
      setSelectedStartDate(onlyDate);

      if (!selectedEndDate || selectedEndDate < onlyDate) {
        setSelectedEndDate(onlyDate);
      }

      if (selectedStartTime) {
        const combined = combineDateTime(onlyDate, selectedStartTime);
        updateForm({ start_time: combined.toISOString() });
      }
    } else {
      setSelectedEndDate(onlyDate);

      if (selectedEndTime) {
        const combined = combineDateTime(onlyDate, selectedEndTime);
        updateForm({ end_time: combined.toISOString() });
      }
    }
  };

  const handleTimeChange = (d: Date | null, isStart: boolean) => {
    if (!d) return;

    if (isStart) {
      setSelectedStartTime(d);

      if (selectedStartDate) {
        const combined = combineDateTime(selectedStartDate, d);
        updateForm({ start_time: combined.toISOString() });
      }

      if (!selectedEndTime || selectedEndTime < d) {
        setSelectedEndTime(d);
      }
    } else {
      setSelectedEndTime(d);

      if (selectedEndDate) {
        const combined = combineDateTime(selectedEndDate, d);
        updateForm({ end_time: combined.toISOString() });
      }
    }
  };

  const handleEventFeeToggle = () => {
    if (isEventFeeEnabled) {
      setIsEventFeeEnabled(false);
      setEventFee("");
    } else {
      setEventFeeModal(true);
    }
  };

const handleRecurrenceToggle = () => {
  if (isRecurrenceEnabled) {
    setIsRecurrenceEnabled(false);
    setRecurrence(null);
    setRecurrenceEndDate(null);
    setRecurrenceCount("");
    setStopType("end_date");
    updateForm({ recurrence: null });
  } else {
    setRecurrenceModal(true);
  }
};
const handleRecurrenceDone = () => {
  if (!recurrence?.frequency) return;

  const rule: any = {
    frequency: recurrence.frequency,
    interval: recurrence.interval || 1,
  };

  if (stopType === "end_date" && recurrenceEndDate) {
    rule.end_date = recurrenceEndDate.toISOString();
  } else if (stopType === "count" && recurrenceCount) {
    rule.count = parseInt(recurrenceCount);
  }

  updateForm({ recurrence: rule });
  setIsRecurrenceEnabled(true);
  setRecurrenceModal(false);
};

  const handleModalClose = () => {
    if (!eventFee || eventFee.length === 0) {
      setIsEventFeeEnabled(false);
    } else {
      setIsEventFeeEnabled(true);
    }
    setEventFeeModal(false);
  };

const handleAttendanceToggle = () => {
  if (!isAttendanceTrackingEnabled) {
    if (formData.latitude === 0 || formData.longitude === 0) {

      Alert.alert("No Location Set", "Please set a location before enabling location boundary.");
      return;
    }
    setAttendanceTrackingModal(true);
  } else {
    setIsAttendanceTrackingEnabled(false);
    updateForm({ geofence_radius: null });
  }
};

  const handleSetParameters = () => {
    setAttendanceTrackingModal(false);
    router.push("/(stack)/mappage")

  };

  const handleCategorySelect = (category: string) => {
    updateForm({ category });  
    setCategoryModal(false);
  };

  const handleVisibilitySelect = (visibility: "Public" | "Private") => {
    updateForm({ visibility });
    setVisibilityModal(false);
  };

  const handleAttendanceProfileSelect = (profile: "quick" | "standard" | "extended" | "unlimited") => {
    setAttendanceProfile(profile);
    updateForm({ attendance_profile: profile });
    setAttendanceProfileModal(false);
  };

  const getInputStyle = (hasValue: boolean) => ({
    backgroundColor: theme.inputBgColor,
    borderWidth: 0,
    fontSize: 13,
    color: hasValue ? theme.text : '#00000059',
  });

  const locationLabel = 
    formData.longitude !== 0 && formData.latitude !== 0
      ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
      : "Set a Location";

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
              <ThemedText style={styles.headerText}>
                {isEditMode ? "Edit Physical Event" : "Create a Physical Event"}
              </ThemedText>
            </View>

            <ImageAdder onImageSelected={(uri) => setImage(uri)} />

            <InputField
              placeholder="Event Name"
              value={formData.name}
              onChangeText={(text) => updateForm({ name: text })}
              inputType="default"
              inputStyle={getInputStyle(!!formData.name)}
              iconName="pencil-sharp"
              showAnyIcon
            />

            <InputField
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => updateForm({ description: text })}
              inputType="default"
              inputStyle={getInputStyle(!!formData.description)}
              multiline
              showAnyIcon
              iconName="pencil-sharp"
            />

            {/* Category Selection */}
            <FormPressable
              label={formData.category || "Select Category"}
              onPress={() => setCategoryModal(true)}
              width={320}
              hasValue={!!formData.category}
              showLeftIcon
              leftIconName="grid-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            {/* Date and Time Pickers */}
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <DateTimeSelector
                  mode="date"
                  value={selectedStartDate}
                  onChange={(d) => handleDateChange(d, true)}
                  placeholder="Start Date"
                  iconName="calendar-outline"
                />
                <DateTimeSelector
                  mode="date"
                  value={selectedEndDate}
                  onChange={(d) => handleDateChange(d, false)}
                  placeholder="End Date"
                  iconName="calendar-outline"
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
                  iconName="time-outline"
                />
                <DateTimeSelector
                  mode="time"
                  value={selectedEndTime}
                  onChange={(d) => handleTimeChange(d, false)}
                  placeholder="End Time"
                  iconName="time-outline"
                />
              </View>
            </View>

            {/* Location */}
            <FormPressable
              label={locationLabel}
              onPress={() => router.push("/select-location")}
              width={320}
              hasValue={formData.longitude !== 0}
              showLeftIcon
              leftIconName="location-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            {/* Visibility */}
            <FormPressable
              label={formData.visibility}
              onPress={() => setVisibilityModal(true)}
              width={320}
              hasValue={!!formData.visibility}
              showLeftIcon
              leftIconName="eye-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

              <FormPressable
                label={ATTENDANCE_PROFILES.find(p => p.id === attendanceProfile)?.label || "Select Duration"}
                onPress={() => setAttendanceProfileModal(true)}
                width={320}
                hasValue={!!attendanceProfile}
                showLeftIcon
                leftIconName="timer-outline"
              >
                <Feather name="chevron-right" size={20} color={theme.text} />
              </FormPressable>


            {/* Set Location Boundary */}
            <FormPressable 
              label="Set Location Boundary" 
              onPress={() => {}} 
              width={320}
              showLeftIcon
              leftIconName="location-outline"
            >
              <Switch
                trackColor={{ false: "#9f9f9f", true: theme.primary }}
                thumbColor={isAttendanceTrackingEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleAttendanceToggle}
                value={isAttendanceTrackingEnabled}
              />
            </FormPressable>

            {/* Attendance Profile Selection */}

            {/* <FormPressable 
              label={isEventFeeEnabled && eventFee ? `${eventFee}` : 'Event Fee'} 
              onPress={() => {}} 
              width={320} 
              hasValue={isEventFeeEnabled && !!eventFee}
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
            </FormPressable> */}

            {/* <FormPressable 
              label="Connect Wallet" 
              onPress={() => router.push("/wallet")} 
              width={320} 
              showLeftIcon
              leftIconName="wallet-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable> */}

            {/* Recurrence Toggle — add this with your other FormPressables */}
        <FormPressable
          label={
            isRecurrenceEnabled && recurrence?.frequency
              ? `Repeats ${recurrence.frequency}`
              : "Repeat Event"
          }
          onPress={() => isRecurrenceEnabled && setRecurrenceModal(true)}
          width={320}
          hasValue={isRecurrenceEnabled}
          showLeftIcon
          leftIconName="repeat-outline"
        >
          <Switch
            trackColor={{ false: "#9f9f9f", true: theme.primary }}
            thumbColor={isRecurrenceEnabled ? theme.primary : "#9f9f9f"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleRecurrenceToggle}
            value={isRecurrenceEnabled}
          />
        </FormPressable>

            <View style={styles.submitButton}>
              <AnimatedButton 
                onPress={handleSubmit} 
                bgcolor={theme.primary} 
                width={200}
                disabled={!isFormValid}
              >
                <Text style={styles.submitButtonText}>
                  {isEditMode ? "Save Changes" : "Submit"}
                </Text>
              </AnimatedButton>
            </View>

            {/* Category Modal */}
        <CentralModal
          isVisible={categoryModal}
          onClose={() => setCategoryModal(false)}
          headerText="Select Category"
          headerButtonIcon="close"
          onHeaderButtonPress={() => setCategoryModal(false)}
          animationType="slide"
        >

          <ScrollView 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }} 
          >
            {CATEGORIES.map((category, idx) => (
              <View key={idx} style={styles.optionRow}>
                <BouncyCheckbox
                  size={20}
                  fillColor={theme.primary}
                  isChecked={formData.category === category}
                  innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                  iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                  text={category}
                  onPress={() => handleCategorySelect(category)}
                  textStyle={{
                    textDecorationLine: "none",
                    fontSize: 15,
                    color: theme.text,
                  }}
                  disableText={false}
                />
              </View>
            ))}
          </ScrollView>
        </CentralModal>
            {/* Visibility Modal */}
            <CentralModal
              isVisible={visibilityModal}
              onClose={() => setVisibilityModal(false)}
              headerText="Event Visibility"
              headerButtonIcon="close" 
              onHeaderButtonPress={() => setVisibilityModal(false)}
              animationType="slide"
            >
              <View style={styles.modalContent}>
                {VISIBILITY_OPTIONS.map((option, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    <BouncyCheckbox
                      size={20}
                      fillColor={theme.primary}
                      isChecked={formData.visibility === option}
                      innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                      iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                      text={option}
                      onPress={() => handleVisibilitySelect(option as "Public" | "Private")}
                      textStyle={{
                        textDecorationLine: "none",
                        fontSize: 15,
                        color: theme.text,
                      }}
                      disableText={false}
                    />
                  </View>
                ))}
              </View>
            </CentralModal>

            {/* Attendance Tracking Modal */}
            <CentralModal
              isVisible={attendanceTrackingModal}
              onClose={() => setAttendanceTrackingModal(false)}
              headerText="Set Attendance"
              headerButtonIcon="close" 
              onHeaderButtonPress={() => setAttendanceTrackingModal(false)}
            >
              <View style={{ width: 270, marginVertical: 20 }}>
                <ThemedText weight="semibold" style={{ textAlign: 'center', color: theme.primary, fontSize: 13 }}>
                  To enable attendance tracking you need to set location parameters
                </ThemedText> 
              </View>
              
              <AnimatedButton onPress={handleSetParameters} width={200} bgcolor={theme.primary}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Set Parameters</Text>
              </AnimatedButton>
            </CentralModal>

            {/* Attendance Profile Modal */}
            <CentralModal
              isVisible={attendanceProfileModal}
              onClose={() => setAttendanceProfileModal(false)}
              headerText="Attendance Duration"
              headerButtonIcon="close" 
              onHeaderButtonPress={() => setAttendanceProfileModal(false)}
              animationType="slide"
            >
              <View style={styles.modalContent}>
                <ThemedText weight="semibold" style={{ color: theme.primary, marginBottom: 12, fontSize: 14 }}>
                  How long should attendance counting last?
                </ThemedText>
              <ScrollView 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20 }} 
              >
                {ATTENDANCE_PROFILES.map((profile, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    <BouncyCheckbox
                      size={20}
                      fillColor={theme.primary}
                      isChecked={attendanceProfile === profile.id}
                      innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                      iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                      text={profile.description}
                      onPress={() => handleAttendanceProfileSelect(profile.id as "quick" | "standard" | "extended" | "unlimited")}
                      textStyle={{
                        textDecorationLine: "none",
                        fontSize: 15,
                        color: theme.text,
                      }}
                      disableText={false}
                    />
                  
                  </View>
                ))}
                </ScrollView>
              </View>
            </CentralModal>

      <CentralModal
        isVisible={recurrenceModal}
        onClose={() => setRecurrenceModal(false)}
        headerText="Repeat Event"
        headerButtonIcon="close"
        onHeaderButtonPress={() => setRecurrenceModal(false)}
        animationType="slide"
      >
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }} // Space for the Done button
        >
          <View style={styles.modalContent}>
            {/* Frequency */}
            <ThemedText weight="semibold" style={{ color: theme.primary, marginBottom: 8 }}>
              How often does this event happen?
            </ThemedText>
            {FREQUENCIES.map((freq, idx) => (
              <View key={idx} style={styles.optionRow}>
                <BouncyCheckbox
                  size={20}
                  fillColor={theme.primary}
                  isChecked={recurrence?.frequency === freq}
                  innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                  iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                  text={freq.charAt(0).toUpperCase() + freq.slice(1)}
                  onPress={() => setRecurrence(prev => ({ ...prev, frequency: freq, interval: prev?.interval || 1 }))}
                  textStyle={{ textDecorationLine: "none", fontSize: 15, color: theme.text }}
                  disableText={false}
                />
              </View>
            ))}

            {/* Interval */}
            <ThemedText weight="semibold" style={{ color: theme.primary, marginTop: 16, marginBottom: 8 }}>
              Interval
            </ThemedText>
            <InputField
              value={recurrence?.interval?.toString() || ""}
              onChangeText={(text) =>
                setRecurrence(prev => ({ ...prev, frequency: prev?.frequency || "daily", interval: parseInt(text) || 1 }))
              }
              inputType="numeric"
              placeholder="1"
              inputStyle={{ 
                width: 215, 
                backgroundColor: theme.inputBgColor, 
                borderWidth: 0,
                color: recurrence?.interval ? theme.text : '#00000059'
              }}
            />

            {/* Stop type */}
            <ThemedText weight="semibold" style={{ color: theme.primary, marginTop: 16, marginBottom: 8 }}>
              Ends
            </ThemedText>
            <View style={styles.optionRow}>
              <BouncyCheckbox
                size={20}
                fillColor={theme.primary}
                isChecked={stopType === "end_date"}
                innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                text="On a date"
                onPress={() => setStopType("end_date")}
                textStyle={{ textDecorationLine: "none", fontSize: 15, color: theme.text }}
                disableText={false}
              />
            </View>
            <View style={styles.optionRow}>
              <BouncyCheckbox
                size={20}
                fillColor={theme.primary}
                isChecked={stopType === "count"}
                innerIconStyle={{ borderWidth: 1.5, borderRadius: 50 }}
                iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                text="After a number of times"
                onPress={() => setStopType("count")}
                textStyle={{ textDecorationLine: "none", fontSize: 15, color: theme.text }}
                disableText={false}
              />
            </View>

            {/* Conditional Inputs */}
            {stopType === "end_date" && (
              <DateTimeSelector
                mode="date"
                value={recurrenceEndDate}
                onChange={(d) => setRecurrenceEndDate(d)}
                placeholder="End Date"
                iconName="calendar-outline"
              />
            )}

            {stopType === "count" && (
              <InputField
                value={recurrenceCount}
                onChangeText={setRecurrenceCount}
                inputType="numeric"
                placeholder="Number of times"
                inputStyle={{ 
                  width: 215, 
                  backgroundColor: theme.inputBgColor, 
                  borderWidth: 0,
                  color: recurrenceCount ? theme.text : '#00000059'
                }}
              />
            )}

            <TouchableOpacity
              style={[styles.doneButton, { opacity: recurrence?.frequency ? 1 : 0.5, marginTop: 20 }]}
              onPress={handleRecurrenceDone}
              disabled={!recurrence?.frequency}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </CentralModal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}