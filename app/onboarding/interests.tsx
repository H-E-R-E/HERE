import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { View, Text, Pressable, Image } from "react-native"
import useTheme from '../hooks/useThemeColors'
import { useRouter } from 'expo-router'
import AnimatedButton from '../../components/AnimatedButton'

const Interests = () => {
    const theme = useTheme();
    const router = useRouter();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
        },
        image: {
            height: 190,
            width: 230,
            marginTop: 40,
        },
        bigText: {
            color: theme.primary,
            fontSize: 30,
            fontWeight: '600',
        },
        smallText: {
            fontSize: 12,
            color: theme.primary,
            marginTop: 5,
        },
        skipContainer: {
            position: 'absolute',
            top: 40,
            right: 20,
        },
        textContainer: {
            marginTop: 150,
            paddingHorizontal: 20,
        }

    }), [theme])
  return (
    //note to self, slide animation. ✨✨
    <View style={styles.container}>
        <Pressable onPress={() => router.replace("/home")} >
            <View style={styles.skipContainer}>
               <Text style={{ color: theme.primary, fontWeight: '500', fontSize: 15 }}>Skip</Text>
               </View>
        </Pressable>
        <View style={styles.textContainer}>
            <Text style={styles.bigText}>We'd like to know your interests</Text>
            <Text style={styles.smallText}>To make your experience better</Text>
        </View>
        <View style={{ alignItems: 'center', marginTop: 70 }}>
         {/* <Image
            source={require('../../assets/onboardingpic.png')}
            style={styles.image}
          />*/}
          <Text>[Image]</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <AnimatedButton
        onPress={() => router.push("/onboarding/pickinterests")}
        width={330}
        borderWidth={0}
        bgcolor={theme.primary}
        style={{ marginTop: 60 }} 
      >
        Continue
      </AnimatedButton>
      </View>
    </View>
  )
}

export default Interests