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

      const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
      const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
      const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
      const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
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
        if (virtualEvent.startDate) {
          const contextDate = new Date(virtualEvent.startDate);
          contextDate.setHours(0, 0, 0, 0);
          setSelectedStartDate(contextDate);
        }
        
        // Initialize time from context
        if (virtualEvent.startTime) {
          const [hours, minutes] = virtualEvent.startTime.split(':').map(Number);
          const contextTime = new Date(0);
          contextTime.setHours(hours, minutes, 0, 0);
          setSelectedStartTime(contextTime);
        }
    
        // Initialize event fee state
        setIsEventFeeEnabled(!!virtualEvent.eventFee && virtualEvent.eventFee.length > 0);
      }, [virtualEvent.startDate, virtualEvent.startTime, virtualEvent.eventFee]);
    // Form validation
    useEffect(() => {
        setIsFormValid(
            !!virtualEvent.title &&
            !!virtualEvent.startDate &&
            !!virtualEvent.endDate &&
            !!virtualEvent.startTime &&
            !!virtualEvent.endTime &&
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
        startDate: params.startDate as string,
        startTime: params.startTime as string,
        endDate: params.endDate as string,
        endTime: params.endTime as string,
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
        primaryView: { 
            flex: 1, 
            alignItems: "center", 
            marginVertical: 50,
            backgroundColor: theme.background,
        },
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
      ? updateVirtualEvent({ startDate: dateStr }) 
      : updateVirtualEvent({ endDate: dateStr });
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
      ? updateVirtualEvent({ startTime: `${hh}:${mm}` })
      : updateVirtualEvent({ endTime: `${hh}:${mm}` });
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

 
  const getInputStyle = (hasValue: boolean) => ({
    backgroundColor: theme.inputBgColor,
    borderWidth: 0,
    fontSize: 13,
    color: hasValue ? theme.text : '#00000059'
  });

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
                startDate: "",
                startTime: "",
                endDate: "",
                endTime: "",
                location: "",
                eventFee: "",
                cohosts: []
            });

            setSelectedStartDate(null);  
            setSelectedStartTime(null);
            setSelectedEndDate(null);  
            setSelectedEndTime(null);
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
                            <Text style={styles.headerText}>Create a Virtual Event</Text>
                        </View>

                        <ImageAdder />

                        <InputField
                            placeholder="Event Name"
                            value={virtualEvent.title}
                            onChangeText={(text) => updateVirtualEvent({ title: text })}
                            inputType="default"
                            inputStyle={getInputStyle(!!virtualEvent.title)}
                            iconName={"pencil-sharp"}
                            showAnyIcon={true}
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
                            value={virtualEvent.description}
                            onChangeText={(text) => updateVirtualEvent({ description: text })}
                            inputType="default"
                            inputStyle={getInputStyle(!!virtualEvent.description)}
                        />

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
                            isEventFeeEnabled && virtualEvent.eventFee 
                            ? `${virtualEvent.eventFee}` 
                            : 'Event Fee'
                        } 
                        onPress={() => {}} 
                        width={320} 
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
                     <FormPressable label="Connect Wallet" onPress={() => router.push("/wallet")} width={320}>
                            <Feather name="chevron-right" size={20} color={theme.text} />
                        </FormPressable>

                        <FormPressable label="Track Attendance" onPress={() => {}} width={320}>
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