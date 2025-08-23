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

export default function VirtualEvent() {
    const [eventName, setEventName] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [description, setDescription] = useState('');
    const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
    const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);
    
    const params = useLocalSearchParams(); 
    const router = useRouter();
    const theme = useThemeColors();

    const toggleEventFee = () => setIsEventFeeEnabled((prev) => !prev);
    const toggleAttendanceTracking = () => setIsAttendanceTrackingEnabled((prev) => !prev);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
        },
        primaryView: { 
            flex: 1, 
            alignItems: 'center', 
            marginVertical: 50,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 20,
            marginBottom: 20,
        },
        backButton: {
            padding: 8,
        },
        headerText: { 
            color: theme.primary,
            fontWeight: '800', 
            fontSize: 20,
            flex: 1,
            textAlign: 'center',
            marginRight: 40, // Compensate for back button width
        },
        dateTimeContainer: {
            flexDirection: "row",
        },
        dateContainer: {
            marginRight: 20,
        },
        switchContainer: {
            paddingVertical: 10,
        },
        submitButton: {
            marginTop: 20,
        },
        submitButtonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
        },
    }), [theme]);

    const handleBackPress = () => {
        // Handle back navigation - you can implement this
        console.log('Back pressed');
    };

    const renderSwitchFormPressable = (
        label: string,
        isEnabled: boolean,
        onToggle: () => void,
        onPress?: () => void
    ) => (
        <FormPressable
            label={label}
            onPress={onPress ?? (() => {})}
            width={320}
            paddingVert={10}
        >
            <Switch 
                trackColor={{ false: '#9f9f9f', true: '#9f9f9f' }}
                thumbColor={isEnabled ? theme.primary : '#9f9f9f'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onToggle}
                value={isEnabled}
            />
        </FormPressable>
    );

    return (    
        <>
            <StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />    
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
                            value={eventName}
                            onChangeText={setEventName}
                            inputType="default"
                        />

                        <View style={styles.dateTimeContainer}>
                            <View style={styles.dateContainer}>
                                <DateTimeSelector
                                    mode="date"
                                    onChange={setSelectedDate}
                                    placeholder="Date"
                                />
                            </View>
                            <View>
                                <DateTimeSelector
                                    mode="time"
                                    onChange={setSelectedTime}
                                    placeholder="Time"
                                />
                            </View>
                        </View>
                        
                        <InputField 
                            placeholder="Description"
                            value={description}
                            onChangeText={setDescription}
                            inputType="default"
                        />

                        <FormPressable
                            label="Add Co-host"
                            onPress={() => router.push("/co-host")}
                            width={320}
                        >
                            <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>

                        {renderSwitchFormPressable(
                            "Event Fee",
                            isEventFeeEnabled,
                            toggleEventFee,
                            () => router.push("/co-host")
                        )}

                        <FormPressable
                            label="Connect Wallet"
                            onPress={() => router.push("/co-host")}
                            width={320}
                        >
                            <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>

                        {renderSwitchFormPressable(
                            "Track Attendance",
                            isAttendanceTrackingEnabled,
                            toggleAttendanceTracking,
                            () => router.push("/co-host")
                        )}

                        <View style={styles.submitButton}>
                            <AnimatedButton
                                onPress={() => router.push("/home")}
                                bgcolor={theme.primary}
                                width={200}
                            >
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </AnimatedButton>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}