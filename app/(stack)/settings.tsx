import React from 'react';
import { Button, View, SafeAreaView } from 'react-native';
import ThemedText from '../../components/ThemedText';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import useThemeColors from "../hooks/useThemeColors";
import { StatusBar } from 'expo-status-bar';

const Settings = () => {
    const { signOut } = useAuth();
    const theme = useThemeColors();

    const handleSignOut = async () => {
        await signOut();
        router.replace("/(auth)/getstarted");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar style={theme.statusBar} translucent />
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Button title='Log Out' onPress={handleSignOut}></Button>
            </View>
        </SafeAreaView>
    );
};

export default Settings;