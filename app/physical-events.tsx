import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Switch } from "react-native";
import InputField from "../components/InputField";
import DateTimeSelector from "../components/DateTimeSelector";
import FormPressable from "../components/FormPressable";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PhysicalEvent() {
    const [eventName, setEventName] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const params = useLocalSearchParams();
    const router = useRouter();

    const [isEnabled, setIsEnabled] = useState(false);

    const toggleSwitch = () => setIsEnabled((prev) => !prev);
useEffect(() => {
        const selected = params.selectedLocation;
        if (typeof selected === "string") {
            setLocation(selected);
        } else if (Array.isArray(selected)) {
            setLocation(selected[0]);
        }
    }, [params]);

        return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', marginTop: 50}}>
         <Text style={{color: "#7851A9", fontWeight: '800', fontSize: 20}}>Physical</Text>
            <View style={styles.imageWrapper}>
                <Ionicons name="image-outline" size={25} style={{position: "absolute", top: 160, left: 160}} />
            </View>
            <InputField 
                placeholder="Event Name"
                value={eventName}
                onChangeText={setEventName}
                inputType="default"
            />

      {/* Date Section */}
      <View style={{ flexDirection: "row"}}>
        <View style={{ marginRight: 20}}>
        <DateTimeSelector
          mode="date"
          onChange={setSelectedDate}
          placeholder="Date"
        />
      </View>

      {/* Time Section */}
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
            label={location || "Location"}
            onPress={() => {router.push("/select-location");
                
            }}
            width= {328}
            children= {
            <Feather name="chevron-right" size={20} color="#5c5c5dff" />
            }
        /> 
        </View>
    </ScrollView>


    );
}

const styles = StyleSheet.create({
    imageWrapper: {
        height: 200,
        width: 200,
        backgroundColor: "#E9E6EE", 
        marginTop: 40

    }
})