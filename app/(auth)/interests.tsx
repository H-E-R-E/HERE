import React, { useMemo } from 'react'
import { StyleSheet, View, Pressable, Image } from 'react-native'
import ThemedText from '../../components/ThemedText'
import useTheme from '../hooks/useThemeColors'
import { useRouter } from 'expo-router'
import AnimatedButton from '../../components/AnimatedButton'

const Interests = () => {
    const theme = useTheme();
    const router = useRouter();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 24,
            paddingVertical: 20,
            backgroundColor: theme.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 40,
        },
        skipButton: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        skipText: {
            color: theme.primary,
            fontSize: 14,
            opacity: 0.7,
        },
        contentWrapper: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        image: {
            height: 220,
            width: 260,
            marginBottom: 50,
            borderRadius: 16,
        },
        textContainer: {
            alignItems: 'center',
            marginBottom: 60,
        },
        bigText: {
            color: theme.primary,
            fontSize: 32,
            fontWeight: '700',
            textAlign: 'center',
            lineHeight: 40,
            marginBottom: 12,
        },
        smallText: {
            fontSize: 15,
            color: theme.primary,
            opacity: 0.6,
            textAlign: 'center',
            lineHeight: 20,
        },
        buttonContainer: {
            width: '100%',
            alignItems: 'center',
            paddingBottom: 20,
        },
    }), [theme])

    return (
        <View style={styles.container}>
            {/* Header with Skip */}
            <View style={styles.header}>
                <View style={{ width: 50, marginTop: 30 }} />
                <Pressable 
                    onPress={() => router.replace("/(tabs)")}
                    style={({ pressed }) => [
                        styles.skipButton,
                        { opacity: pressed ? 0.6 : 1 }
                    ]}
                >
                    <ThemedText weight="semibold" style={styles.skipText}>
                        Skip
                    </ThemedText>
                </Pressable>
            </View>

            {/* Main Content */}
            <View style={styles.contentWrapper}>
                {/* <Image
                    source={require('../../assets/interests-illustration.png')}
                    style={styles.image}
                    resizeMode="contain"
                /> */}

                {/* Text Section */}
                <View style={styles.textContainer}>
                    <ThemedText weight="bold" style={styles.bigText} family='source'>
                        We'd like to know your interests
                    </ThemedText>
                    <ThemedText weight="regular" style={styles.smallText}>
                        To make your experience better
                    </ThemedText>
                </View>
            </View>

            {/* Button */}
            <View style={styles.buttonContainer}>
                <AnimatedButton
                    onPress={() => router.push("/(auth)/pickinterests")}
                    width={330}
                    borderWidth={0}
                    bgcolor={theme.primary}
                >
                    Continue
                </AnimatedButton>
            </View>
        </View>
    )
}

export default Interests