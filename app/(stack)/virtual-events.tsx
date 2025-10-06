import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, SafeAreaView, Pressable, Modal } from "react-native";
import InputField from "../../components/InputField";
import DateTimeSelector from "../../components/DateTimeSelector";
import FormPressable from "../../components/FormPressable";
import ImageAdder from "../../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../../components/AnimatedButton";
import useThemeColors from "../hooks/useThemeColors";
import { useEvent } from "../../context/EventContext";
import users from "../../data/users.json";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/AuthContext";

export default function VirtualEvent() {
    const router = useRouter();
    const theme = useThemeColors();
      const params = useLocalSearchParams();

      const [selectedDate, setSelectedDate] = useState<Date | null>(null);
      const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
    const [eventFeeModal, setEventFeeModal] = useState(false);
    const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const { virtualEvent, updateVirtualEvent, setIsPhysical, addEvent, events, updateEvent } = useEvent();
    const { user } = useAuth();
    useEffect(() => {
        setIsPhysical(false);
    }, [setIsPhysical]);

      useEffect(() => {
        // Initialize date from context
        if (virtualEvent.date) {
          const contextDate = new Date(virtualEvent.date);
          contextDate.setHours(0, 0, 0, 0);
          setSelectedDate(contextDate);
        }
        
        // Initialize time from context
        if (virtualEvent.time) {
          const [hours, minutes] = virtualEvent.time.split(':').map(Number);
          const contextTime = new Date(0);
          contextTime.setHours(hours, minutes, 0, 0);
          setSelectedTime(contextTime);
        }
    
        // Initialize event fee state
        setIsEventFeeEnabled(!!virtualEvent.eventFee && virtualEvent.eventFee.length > 0);
      }, [virtualEvent.date, virtualEvent.time, virtualEvent.eventFee]);
    // Form validation
    useEffect(() => {
        setIsFormValid(
            !!virtualEvent.title &&
            !!virtualEvent.date &&
            !!virtualEvent.time &&
            !!virtualEvent.description
        );
    }, [virtualEvent]);

    useEffect(() => {
      if (!params.id) return;
    
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
      updateVirtualEvent({
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
    

    const cohostNames = (virtualEvent.cohosts ?? []).map((id) => {
    const match = (users as Array<{ id: string | number; name: string }>).find(
      (u) => String(u.id) === String(id)
    );
    return match?.name ?? String(id);
  });
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
            alignSelf: 'flex-end',
            justifyContent: 'space-between', 
            flexDirection: 'row',
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#7851A91A',
            width: 280,
            paddingLeft: 110,
            paddingRight: 20,
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
    }), [theme]);

    const handleBackPress = () => {
        router.push("/(tabs)");
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

    function handleEventFeeToggle() {
        isEventFeeEnabled? setIsEventFeeEnabled(false): setEventFeeModal(true)
    }
    
    function handleModalClose() {
        if ((virtualEvent.eventFee)?.length === 0) {
            setIsEventFeeEnabled(false);
            setEventFeeModal(false);
        }
        else {
            setEventFeeModal(false);  
            setIsEventFeeEnabled(true);
        }
    }

  // Reset form fields AFTER the event is added

 

 const handleSubmit = () => {
            if (!isFormValid) return;
        const finalEvent = {
            ...virtualEvent,
            eventType: "virtual" as const,
            creator: user?.id,
        }
        const existingEventIndex = events.findIndex(e => e.id === virtualEvent.id);
        
        if (existingEventIndex >= 0) {
            updateEvent(virtualEvent.id, finalEvent);
        } else {
            addEvent(finalEvent);
        }

                            // Reset all fields
              setTimeout(() => {
            updateVirtualEvent({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                eventFee: "",
                cohosts: []
            });

            setSelectedDate(null);  
            setSelectedTime(null);
            setIsEventFeeEnabled(false);
            setIsAttendanceTrackingEnabled(false);
              }, 100);

            router.replace("/events");
            };

    
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
                            <Text style={styles.headerText}>Virtual</Text>
                        </View>

                        <ImageAdder />

                        <InputField
                            placeholder="Event Name"
                            value={virtualEvent.title}
                            onChangeText={(text) => updateVirtualEvent({ title: text })}
                            inputType="default"
                            inputStyle={{ borderWidth: 0 }}
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
                            value={virtualEvent.description}
                            onChangeText={(text) => updateVirtualEvent({ description: text })}
                            inputType="default"
                            inputStyle={{ borderWidth: 0 }}
                        />

                        <FormPressable
                        label={
                            cohostNames.length > 0 ? cohostNames.join(", ") : "Add Co-host"
                        }
                        onPress={() => router.push("/co-host")}
                        width={320}
                        hasValue={cohostNames.length > 0}
                        paddingVert={25}
                        >
                        <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>
            
                        <FormPressable 
                        label={
                            isEventFeeEnabled && virtualEvent.eventFee 
                            ? `${virtualEvent.eventFee}` 
                            : 'Event Fee'
                        } 
                        onPress={() => {}} 
                        width={320} 
                        paddingVert={22}
                        hasValue={isEventFeeEnabled && !!virtualEvent.eventFee}
                        >
                    <Switch
                    trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                    thumbColor={isEventFeeEnabled ? theme.primary : "#9f9f9f"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={handleEventFeeToggle}
                    value={isEventFeeEnabled}
                    />
                    </FormPressable>                        
                     <FormPressable label="Connect Wallet" onPress={() => router.push("/wallet")} width={320} paddingVert={22}>
                            <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>

                        <FormPressable label="Track Attendance" onPress={() => {}} width={320} paddingVert={22}>
                            <Switch
                                trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                                thumbColor={isAttendanceTrackingEnabled ? theme.primary : "#9f9f9f"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => setIsAttendanceTrackingEnabled((p) => !p)}
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
                            {/*The point is when you click on the button, it'll take all events, which is physicalEvents, the object, directly to the databse. Meanwhile, it has an id, so we're going to take it back to notifications, as the flow expects.*/}

                  
                           <Modal transparent visible={eventFeeModal} animationType="slide" onRequestClose={handleModalClose}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHead}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>Event Fee</Text>
                        <Pressable
                          onPress={handleModalClose}
                          hitSlop={10}
                           >
                          <Ionicons name="close" size={24} color="#333" />
                          </Pressable>
                          </View>
                  <InputField
                    value={virtualEvent.eventFee}
                    onChangeText={(text) => updateVirtualEvent({eventFee: text})}
                    inputStyle={{ width: 215, marginTop: 15, }}
                    placeholder="Add Amount"
                    >
                  
                  </InputField>
                </View>
              </View>
            </Modal>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}