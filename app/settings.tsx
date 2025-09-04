import React from 'react'
import { Button, View } from 'react-native'
import ThemedText from '../components/ThemedText'
import { useAuth } from '../context/AuthContext'
import { router } from 'expo-router';

const Settings = () => {
    const { signOut } = useAuth();
    const handleSignOut = async () => {
        await signOut();
        router.replace("/onboarding/getstarted")
    }
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
    <Button title='Log Out' onPress={handleSignOut}></Button>
    </View>
  )
}

export default Settings