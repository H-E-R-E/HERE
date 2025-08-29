import React, { use } from "react";
import { StatusBar, StyleSheet, View, TouchableOpacity, Image } from "react-native";
import BlurryEllipse from "../../components/BlurryEllipse";
import ProfileDisplay from "../../components/ProfileDisplay";
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from "@react-navigation/native";
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";


export default function Home() {
const theme = useThemeColors();
const router = useRouter();

    return (
        <>
    <StatusBar backgroundColor="transparent" translucent={true} barStyle="dark-content" />    
        <View style={{flex: 1}}>
        <View>
            <BlurryEllipse />
        </View>

        <ProfileDisplay /> 

         <TouchableOpacity
            onPress={() => {router.push("/settings")}}
            style={{
                position: 'absolute',
                top: 50,
                right: 20,
                }}
                >
            <Ionicons name="settings-outline" size={35} color={theme.primary} />
        </TouchableOpacity>
        </View>
        </>
    )
}

