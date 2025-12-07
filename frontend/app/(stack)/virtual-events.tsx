import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, SafeAreaView, Pressable } from "react-native";
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
import { useAuth } from "../../context/AuthContext";
import CentralModal from "../../components/CentralModal";
import BouncyCheckbox from "react-native-bouncy-checkbox";

const CATEGORIES = ["Conference"]; 
const VISIBILITY_OPTIONS = ["Public", "Private"];

export default function VirtualEvent() {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
  const [eventFee, setEventFee] = useState("");
  const [eventFeeModal, setEventFeeModal] = useState(false);
  const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  
  // Temporary states for fields not yet in schema
  const [cohosts, setCohosts] = useState<string[]>([]);

  const router = useRouter();
  const theme = useThemeColors();

  const { virtualEvent, updateVirtualEvent, setIsPhysical, addEvent } = useEvent();
  const { user } = useAuth();

  useEffect(() => {
    setIsPhysical(false);
  }, []);

  // Initialize dates from context
  useEffect(() => {
    if (virtualEvent.start_time) {
      const startDate = new Date(virtualEvent.start_time);
      const onlyDate = new Date(startDate);
      onlyDate.setHours(0, 0, 0, 0);
      setSelectedStartDate(onlyDate);
      setSelectedStartTime(startDate);
    }

    if (virtualEvent.end_time) {
      const endDate = new Date(virtualEvent.end_time);
      const onlyDate = new Date(endDate);
      onlyDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(onlyDate);
      setSelectedEndTime(endDate);
    }
  }, []);

  useEffect(() => {
    setIsFormValid(
      !!virtualEvent.name &&
      !!virtualEvent.start_time &&
      !!virtualEvent.end_time &&
      !!virtualEvent.description &&
      !!virtualEvent.category
    );
  }, [virtualEvent]);

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
          paddingTop: 20,
        },
        optionRow: {
          marginVertical: 12,
          paddingVertical: 4,
        },
      }),
    [theme]
  );

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    const finalEvent = {
      ...virtualEvent,
    };
    
    addEvent(finalEvent);
    router.replace("/events");
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
        updateVirtualEvent({ start_time: combined.toISOString() });
      }
    } else {
      setSelectedEndDate(onlyDate);

      if (selectedEndTime) {
        const combined = combineDateTime(onlyDate, selectedEndTime);
        updateVirtualEvent({ end_time: combined.toISOString() });
      }
    }
  };

  const handleTimeChange = (d: Date | null, isStart: boolean) => {
    if (!d) return;

    if (isStart) {
      setSelectedStartTime(d);

      if (selectedStartDate) {
        const combined = combineDateTime(selectedStartDate, d);
        updateVirtualEvent({ start_time: combined.toISOString() });
      }

      if (!selectedEndTime || selectedEndTime < d) {
        setSelectedEndTime(d);
      }
    } else {
      setSelectedEndTime(d);

      if (selectedEndDate) {
        const combined = combineDateTime(selectedEndDate, d);
        updateVirtualEvent({ end_time: combined.toISOString() });
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

  const handleModalClose = () => {
    if (!eventFee || eventFee.length === 0) {
      setIsEventFeeEnabled(false);
    } else {
      setIsEventFeeEnabled(true);
    }
    setEventFeeModal(false);
  };

  const handleCategorySelect = (category: string) => {
    updateVirtualEvent({ category });
    setCategoryModal(false);
  };

  const handleVisibilitySelect = (visibility: "Public" | "Private") => {
    updateVirtualEvent({ visibility });
    setVisibilityModal(false);
  };

  const getInputStyle = (hasValue: boolean) => ({
    backgroundColor: theme.inputBgColor,
    borderWidth: 0,
    fontSize: 13,
    color: hasValue ? theme.text : '#00000059',
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
              <ThemedText style={styles.headerText}>Create a Virtual Event</ThemedText>
            </View>

            <ImageAdder onImageSelected={(uri) => setImage(uri)} />

            <InputField
              placeholder="Event Name"
              value={virtualEvent.name}
              onChangeText={(text) => updateVirtualEvent({ name: text })}
              inputType="default"
              inputStyle={getInputStyle(!!virtualEvent.name)}
              iconName="pencil-sharp"
              showAnyIcon
            />

            <InputField
              placeholder="Description"
              value={virtualEvent.description}
              onChangeText={(text) => updateVirtualEvent({ description: text })}
              inputType="default"
              inputStyle={getInputStyle(!!virtualEvent.description)}
              multiline
              showAnyIcon
              iconName="pencil-sharp"
            />

            {/* Category Selection */}
            <FormPressable
              label={virtualEvent.category || "Select Category"}
              onPress={() => setCategoryModal(true)}
              width={320}
              hasValue={!!virtualEvent.category}
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

            {/* Visibility */}
            <FormPressable
              label={virtualEvent.visibility}
              onPress={() => setVisibilityModal(true)}
              width={320}
              hasValue={!!virtualEvent.visibility}
              showLeftIcon
              leftIconName="eye-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            {/* Track Attendance */}
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
                onValueChange={() => setIsAttendanceTrackingEnabled(!isAttendanceTrackingEnabled)}
                value={isAttendanceTrackingEnabled}
              />
            </FormPressable>

            {/* Temporary fields (not in schema yet) */}
            <FormPressable
              label="Add Co-host"
              onPress={() => router.push("/co-host")}
              width={320}
              hasValue={false}
              showLeftIcon
              leftIconName="people-outline"
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable> 

            <FormPressable 
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

            {/* Category Modal */}
            <CentralModal
              isVisible={categoryModal}
              onClose={() => setCategoryModal(false)}
              headerText="Select Category"
              headerButtonIcon="close" 
              onHeaderButtonPress={() => setCategoryModal(false)}
              animationType="slide"
            >
              <View style={styles.modalContent}>
                {CATEGORIES.map((category, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    <BouncyCheckbox
                      size={20}
                      fillColor={theme.primary}
                      isChecked={virtualEvent.category === category}
                      innerIconStyle={{ borderWidth: 2, borderRadius: 50 }}
                      iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                      text={category}
                      onPress={() => handleCategorySelect(category)}
                      textStyle={{
                        textDecorationLine: "none",
                        fontSize: 15,
                        color: theme.primary,
                      }}
                      disableText={false}
                    />
                  </View>
                ))}
              </View>
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
                      isChecked={virtualEvent.visibility === option}
                      innerIconStyle={{ borderWidth: 2, borderRadius: 50 }}
                      iconStyle={{ borderRadius: 50, borderColor: theme.primary }}
                      text={option}
                      onPress={() => handleVisibilitySelect(option as "Public" | "Private")}
                      textStyle={{
                        textDecorationLine: "none",
                        fontSize: 15,
                        color: theme.primary,
                      }}
                      disableText={false}
                    />
                  </View>
                ))}
              </View>
            </CentralModal>

            {/* Event Fee Modal */}
            <CentralModal
              isVisible={eventFeeModal}
              onClose={handleModalClose}
              headerText="Event Fee"
              headerButtonIcon="close" 
              onHeaderButtonPress={handleModalClose}
              animationType="slide"
            >
              <InputField
                value={eventFee}
                onChangeText={(text) => setEventFee(text)}
                inputStyle={{ 
                  width: 215, 
                  marginTop: 15, 
                  backgroundColor: '#E9E6EE', 
                  borderWidth: 0,
                  color: eventFee ? '#000000' : '#00000059'
                }}
                placeholder="Add Amount"
              />
            </CentralModal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}