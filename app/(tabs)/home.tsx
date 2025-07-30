import React from "react";
import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import BlurryEllipse from "../../components/BlurryEllipse";
import ProfileDisplay from "../../components/ProfileDisplay";
import { Feather } from '@expo/vector-icons';
import { NavigationContainer } from "@react-navigation/native";



export default function Home() {
    return (
        <View style={{flex: 1}}>
        <View>
            <BlurryEllipse />
        </View>

        <ProfileDisplay /> 

         <TouchableOpacity
            onPress={() => console.log('Pressed')}
            style={{
                position: 'absolute',
                top: 50,
                right: 20,
                }}
                >
            <Feather name="calendar" size={35} color="#7851A9" />
        </TouchableOpacity>
        </View>
    )
}

const style = StyleSheet.create({

})