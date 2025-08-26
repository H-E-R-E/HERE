import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, StatusBar, SafeAreaView, Pressable } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import ImageAdder from "../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../components/AnimatedButton";
import useThemeColors from "./hooks/useThemeColors";
import { useEvent } from "../context/EventContext";

export default function VirtualEvent() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const theme = useThemeColors();
    const { virtualEvent, updateVirtualEvent, setIsPhysical } = useEvent();

    const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
    const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);

    useEffect(() => {
    setIsPhysical(false);
    }, [setIsPhysical]);


    const styles = useMemo(() => StyleSheet.create({
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
    }), [theme]);

    const handleBackPress = () => {
        router.push("/home");
    };

    const handleDateChange = (d: Date | null) => {
        if (d) {
            updateVirtualEvent({ date: d.toISOString().slice(0, 10) });
        }
    };

    const handleTimeChange = (d: Date | null) => {
        if (d) {
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            updateVirtualEvent({ time: `${hh}:${mm}` });
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
                            <Text style={styles.headerText}>Virtual</Text>
                        </View>

                        <ImageAdder />

                        <InputField
                            placeholder="Event Name"
                            value={virtualEvent.title}
                            onChangeText={(text) => updateVirtualEvent({ title: text })}
                            inputType="default"
                        />

                        <View style={styles.dateTimeContainer}>
                            <View style={styles.dateContainer}>
                                <DateTimeSelector
                                    mode="date"
                                    onChange={handleDateChange}
                                    placeholder={virtualEvent.date || "Date"}
                                />
                            </View>
                            <View>
                                <DateTimeSelector
                                    mode="time"
                                    onChange={handleTimeChange}
                                    placeholder={virtualEvent.time || "Time"}
                                />
                            </View>
                        </View>

                        <InputField
                            placeholder="Description"
                            value={virtualEvent.description}
                            onChangeText={(text) => updateVirtualEvent({ description: text })}
                            inputType="default"
                        />

                        <FormPressable
                            label="Add Co-host"
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