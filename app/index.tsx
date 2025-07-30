import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3';
import AnimatedButton from '../components/AnimatedButton'

export default function Home() {
    const iconSlideAnim = useRef(new Animated.Value(0)).current;
    const router = useRouter();
      Animated.timing(iconSlideAnim, {
        toValue: -70,
        duration: 1000,
        useNativeDriver: true
      }).start();

    const [fontsLoaded] = useFonts({
        SourceSans3_400Regular,
    })

    if (!fontsLoaded) {
        return null;
    }
      return (
        <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Text>[Logo]</Text>
      </View>

      <AnimatedButton onPress={() => (router.push('/login'))} color='#7851A9' bgcolor='#F8F8F8' width={200}>Get Started</AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7851A9',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 70
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 30,
    fontFamily: 'SourceSans3_400Regular',
  }
});
