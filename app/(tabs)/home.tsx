import React, { use } from "react";
import { StatusBar, StyleSheet, View, TouchableOpacity, Image } from "react-native";
import BlurryEllipse from "../../components/BlurryEllipse";
import ProfileDisplay from "../../components/ProfileDisplay";
import { Feather } from '@expo/vector-icons';
import { NavigationContainer } from "@react-navigation/native";
import useThemeColors from "../hooks/useThemeColors";


export default function Home() {
const theme = useThemeColors();

    return (
        <>
    <StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />    
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
            <Feather name="calendar" size={35} color={theme.primary} />
        </TouchableOpacity>
        </View>
        </>
    )
}

const style = StyleSheet.create({

})