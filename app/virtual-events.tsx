import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, StatusBar, SafeAreaView, Pressable, Modal } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import ImageAdder from "../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AnimatedButton from "../components/AnimatedButton";
import useThemeColors from "./hooks/useThemeColors";
import { useEvent } from "../context/EventContext";
import users from ".././data/users.json";

export default function VirtualEvent() {
    const router = useRouter();
    const theme = useThemeColors();
    const { virtualEvent, updateVirtualEvent, setIsPhysical, addEvent, events } = useEvent();

    const [isEventFeeEnabled, setIsEventFeeEnabled] = useState(false);
    const [eventFeeModal, setEventFeeModal] = useState(false);
    const [isAttendanceTrackingEnabled, setIsAttendanceTrackingEnabled] = useState(false);

    useEffect(() => {
    setIsPhysical(false);
    }, [setIsPhysical]);


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

    function handleSubmit() {
        //probable db fetch api post stuff
        addEvent(virtualEvent);
        console.log(events);
        router.replace("/(tabs)/events");
    }

    
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
                            inputStyle={{ borderWidth: 0 }}
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
                            inputStyle={{ borderWidth: 0 }}
                        />

                        <FormPressable
                            label={cohostNames.length > 0 ? cohostNames.join(", ") : "Add Co-host"}
                            onPress={() => router.push("/co-host")}
                            width={320}
                        >   
                            <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>

                    <FormPressable 
                    label={(virtualEvent.eventFee) == undefined? 'Event Fee' : (virtualEvent.eventFee).length > 0? virtualEvent.eventFee: 'Event Fee'} 
                    onPress={() => {}} 
                    width={320} 
                    paddingVert={10}
                    >
                    <Switch
                        trackColor={{ false: "#9f9f9f", true: "#9f9f9f" }}
                        thumbColor={isEventFeeEnabled ? theme.primary : "#9f9f9f"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleEventFeeToggle}
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
                            <AnimatedButton onPress={handleSubmit} bgcolor={theme.primary} width={200}>
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </AnimatedButton>
                            {/*The point is when you click on the button, it'll take all events, which is physicalEvents, the object, directly to the databse. Meanwhile, it has an id, so we're going to take it back to notifications, as the flow expects.*/}

                        </View>
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