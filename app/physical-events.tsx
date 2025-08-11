import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Switch, StatusBar, SafeAreaView } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import ImageAdder from "../components/ImageAdder";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedButton from "../components/AnimatedButton";

export default function PhysicalEvent() {
    const [eventName, setEventName] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState<string>('');
    const [displayLocation, setDisplayLocation] = useState<string>('');
    const params = useLocalSearchParams(); 
    const router = useRouter();
    
    // Code for eventual toggle switch
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled((prev) => !prev);

    useEffect(() => {
        const { place } = params; // Use params instead of calling useLocalSearchParams again
        if (place) {
            try {
                const parsedPlace = JSON.parse(place as string);
                if (typeof parsedPlace === "string" && parsedPlace.length > 30) {
                    const truncatedParsedPlace = parsedPlace.substring(0, 30) + '...';
                    setLocation(parsedPlace);
                    setDisplayLocation(truncatedParsedPlace);
                }
            } catch (err) {
                console.error("Error parsing place param", err);
            }
        }
    }, [params]);

    return (    
        <>
            <StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />    
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}> 
                    <View style={{ flex: 1, alignItems: 'center', marginVertical: 50 }}>
                        <Text style={{ color: "#7851A9", fontWeight: '800', fontSize: 20 }}>Physical</Text>
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
                            label={displayLocation || "Location"}
                            onPress={() => router.push("/select-location")}
                            width={320}
                        >
                            <Feather name="chevron-right" size={20} color="#5c5c5dff" />
                        </FormPressable>

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