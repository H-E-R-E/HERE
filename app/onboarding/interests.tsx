import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { View, Text, Pressable, Image } from "react-native"
import useTheme from '../hooks/useThemeColors'
import { useRouter } from 'expo-router'
import AnimatedButton from '../../components/AnimatedButton'

const Interests = () => {
    const color = useTheme();
    const router = useRouter();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        image: {
            height: 190,
            width: 230,
        },
        bigText: {
            color: color.primary,
            fontSize: 30,
            fontWeight: '600',
        },
        smallText: {
            fontSize: 12,
            color: color.primary
        },
        skip: {
            color: color.primary,
            position: 'absolute',
            top: 10,
            left: 350,
            fontWeight: 500,
        }

    }), [color])
  return (
    //note to self, slide animation. ✨✨
    <View style={styles.container}>
        <Pressable onPress={() => router.replace("/home")}>
               <Text style={styles.skip}>Skip</Text>
        </Pressable>
        <View style={{ padding: 20, marginBottom: 150 }}>
            <Text style={styles.bigText}>We'd like to know your interests</Text>
            <Text style={styles.smallText}>To make your experience better</Text>
        </View>
        <Text>[Image]</Text>
       { /* <Image
          source={require('../../assets/onboardingpic.png')}
          style={styles.image}
        />
       */}
      <AnimatedButton
        onPress={() => router.push("/onboarding/pickinterests")}
        width={330}
        borderWidth={0}
        bgcolor={color.primary}
        style={{ marginTop: 30, marginBottom: 20 }} 
      >
        Continue
      </AnimatedButton>
    </View>
  )
}

export default Interests