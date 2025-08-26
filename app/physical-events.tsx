import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, StatusBar, SafeAreaView, Pressable } from "react-native";
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

export default function PhysicalEvent() {
  // local UI-only state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [displayLocation, setDisplayLocation] = useState<string>("");
  const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
  const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);

  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeColors();

  const { physicalEvent, updatePhysicalEvent, setIsPhysical } = useEvent();

  useEffect(() => {
    setIsPhysical(true);
  }, []);


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
        dateContainer: { marginRight: 20 },
        switchContainer: { paddingVertical: 10 },
        submitButton: { marginTop: 20 },
        submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
      }),
    [theme]
  );

  const handleBackPress = () => {
    router.push("/home");
  };


  const handleDateChange = (d: Date | null) => {
    setSelectedDate(d);
    if (d) {

      const dateStr = d.toISOString().slice(0, 10);
      updatePhysicalEvent({ date: dateStr });
    }
  };

  const handleTimeChange = (d: Date | null) => {
    setSelectedTime(d);
    if (d) {
      // store HH:mm (24h) — adjust to your format/component
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      updatePhysicalEvent({ time: `${hh}:${mm}` });
    }
  };

  return (
    <>
      <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.primaryView}>
            <View style={styles.header}>
              <Pressable style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="arrow-back" size={24} color={theme.primary} />
              </Pressable>
              <Text style={styles.headerText}>Physical</Text>
            </View>

            <ImageAdder />

            <InputField
              placeholder="Event Name"
              value={physicalEvent.title}
              onChangeText={(text) => updatePhysicalEvent({ title: text })}
              inputType="default"
            />

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <DateTimeSelector
                  mode="date"
                  onChange={handleDateChange}
                  placeholder={physicalEvent.date || "Date"}
                />
              </View>
              <View>
                <DateTimeSelector
                  mode="time"
                  onChange={handleTimeChange}
                  placeholder={physicalEvent.time || "Time"}
                />
              </View>
            </View>

            <InputField
              placeholder="Description"
              value={physicalEvent.description}
              onChangeText={(text) => updatePhysicalEvent({ description: text })}
              inputType="default"
            />

            <FormPressable
              label={
                physicalEvent.location
                  ? truncate(physicalEvent.location)
                  : displayLocation || "Location"
              }
              onPress={() => router.push("/select-location")}
              width={320}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable
              label={
                cohostNames.length > 0 ? cohostNames.join(", ") : "Add Co-host"
              }
              onPress={() => router.push("/co-host")}
              width={320}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>


            <FormPressable label="Event Fee" onPress={() => {}} width={320} paddingVert={10}>
              <Switch
                trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                thumbColor={isEventFeeEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setIsEventFeeEnabled((p) => !p)}
                value={isEventFeeEnabled}
              />
            </FormPressable>

            <FormPressable label="Connect Wallet" onPress={() => router.push("/wallet")} width={320}>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </FormPressable>

            <FormPressable label="Track Attendance" onPress={() => {}} width={320} paddingVert={10}>
              <Switch
                trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                thumbColor={isAttendanceTrackingEnabled ? theme.primary : "#9f9f9f"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setIsAttendanceTrackingEnabled((p) => !p)}
                value={isAttendanceTrackingEnabled}
              />
            </FormPressable>

            <View style={styles.submitButton}>
              <AnimatedButton onPress={() => router.push("/home")} bgcolor={theme.primary} width={200}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </AnimatedButton>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
