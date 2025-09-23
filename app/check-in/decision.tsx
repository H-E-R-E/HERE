import React, { useMemo } from 'react'
import * as LocalAuthentication from 'expo-local-authentication';
import { StyleSheet, View } from 'react-native';
import {SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useThemeColors from '../hooks/useThemeColors';
import AnimatedButton from '../../components/AnimatedButton';
import { useRouter } from 'expo-router';
import ThemedText from '../../components/ThemedText';

const Decision = () => {

    const theme = useThemeColors();
    const router = useRouter();
    const styles = useMemo(() => 
        StyleSheet.create({
            container: {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
            }
        })
    , [theme])
  return (
   <>
    <StatusBar style={theme.statusBar} translucent />
    <SafeAreaView>
        <View style={styles.container}>
            <AnimatedButton onPress={() => {router.push('/check-in/fingerprintEntry')}} width={300}>FingerPrint</AnimatedButton>
            <ThemedText>OR</ThemedText>
            <AnimatedButton onPress={() => {router.push('/check-in/pinEntry')}} width={300}>HERE Pin</AnimatedButton>
        </View>
    </SafeAreaView>
   </>

  )
}

export default Decision