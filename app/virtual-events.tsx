import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, StatusBar, SafeAreaView } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import ImageAdder from "../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../components/AnimatedButton";

export default function VirtualEvent() {
    const [eventName, setEventName] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [description, setDescription] = useState('');
    const params = useLocalSearchParams(); 
    const router = useRouter();

    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled((prev) => !prev);


    return (    
        <>
            <StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />    
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}> 
                    <View style={{ flex: 1, alignItems: 'center', marginVertical: 50 }}>
                        <Text style={{ color: "#7851A9", fontWeight: '800', fontSize: 20 }}>Virtual</Text>
                        <ImageAdder />
                
                        <InputField 
                            placeholder="Event Name"
                            value={eventName}
                            onChangeText={setEventName}
                            inputType="default"
                        />

                        {/* Date and Time Section */}
                        <View style={{ flexDirection: "row" }}>
                            <View style={{ marginRight: 20 }}>
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
                            label={"Add Co-host"}
                            onPress={() => router.push("/co-host")}
                            width={320}
                        >
                            <Feather name="chevron-right" size={20} color="#5c5c5dff" />
                        </FormPressable>
                        <FormPressable
                            label={"Event Fee"}
                            onPress={() => router.push("/co-host")}
                            width={320}
                            paddingVert={10}
                        >
                           <Switch 
                            trackColor={{false: '#9f9f9fff', true: '#9f9f9fff'}}
                            thumbColor={isEnabled ? '#7851A9' : '#9f9f9fff'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                            
                            />
                        </FormPressable>

                        <FormPressable
                            label={"Connect Wallet"}
                            onPress={() => router.push("/co-host")}
                            width={320}
                        >
                            <Feather name="chevron-right" size={20} color="#5c5c5dff" />
                        </FormPressable>
                        <FormPressable
                            label={"Track Attendance"}
                            onPress={() => router.push("/co-host")}
                            width={320}
                            paddingVert={10}
                        >
                           <Switch 
                            trackColor={{false: '#9f9f9fff', true: '#9f9f9fff'}}
                            thumbColor={isEnabled ? '#7851A9' : '#9f9f9fff'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                            
                            />
                        </FormPressable>

                        <AnimatedButton
                            onPress={() => (router.push("/home"))}
                            bgcolor="#7851A9"
                            width={200}
                        >
                            <Text>Submit</Text>
                        </AnimatedButton>



                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}