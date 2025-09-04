import React from "react";
import { View, TouchableOpacity } from "react-native";
import ThemedText from '../../components/ThemedText';
import BlurryEllipse from "../../components/BlurryEllipse";
import ProfileDisplay from "../../components/ProfileDisplay";
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import SvgPicEventPage from "../../components/SvgPicEventPage";
import { StatusBar } from "expo-status-bar";


export default function Home() {
const theme = useThemeColors();
const router = useRouter();

    return (
        <>
    <StatusBar style={theme.statusBar} translucent />   
        <View>
            <BlurryEllipse />
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <SvgPicEventPage />
            <ThemedText weight="semibold" style={{ color: theme.primary }}>Create an event to save him!!</ThemedText>
        </View>
        </>
    )
}

