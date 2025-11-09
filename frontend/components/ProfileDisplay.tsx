import React, { useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import ThemedText from './ThemedText';
import { useAuth } from '../context/AuthContext';
import useThemeColors from '../app/hooks/useThemeColors';
import { useRouter } from 'expo-router';

const ProfileDisplay = () => {
  const { user } = useAuth();
  const theme = useThemeColors();
  const router = useRouter();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      top: 30,
      left: 15,
      flexDirection: 'row',
    },
    avatarWrapper: {
      width: 52,
      height: 52,
      borderRadius: 26,
      padding: 1,
      backgroundColor: 'white',
      marginLeft: 5,
      marginTop: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    textWrapper: {
      flexDirection: 'column',
      marginLeft: 5,
      marginTop: 20,
    },
    text: {
      color: theme.text, 
      fontSize: 12,
    },
  }), [theme]);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarWrapper} 
        onPress={() => router.push("/(stack)/profile")}
      >
        <Image
          source={
            user.avatar_url 
              ? { uri: user.avatar_url }
              : require('../assets/flowerpfp.jpg')
          }
          style={styles.avatar}
        />
      </TouchableOpacity>
      <View style={styles.textWrapper}>
        <ThemedText family='source' weight='bold' style={[styles.text, { fontSize: 20 }]}>
          Hello {user.username}
        </ThemedText>
        <ThemedText family='source' style={styles.text}>
          Ready to create an event?
        </ThemedText>
      </View>
    </View>
  );
};

export default ProfileDisplay;