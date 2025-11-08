
import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import ThemedText from './ThemedText';
import { useAuth } from '../context/AuthContext';
import useThemeColors from '../app/hooks/useThemeColors';

const ProfileDisplay = () => {
  const { user } = useAuth();
  const theme = useThemeColors();

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
}), [theme])



  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image
          source={require('../assets/flowerpfp.jpg')}
          style={styles.avatar}
        />
      </View>
      <View style={styles.textWrapper}>
        <ThemedText family='source' weight='bold' style={[styles.text, { fontSize: 20 }]}>Hello {user?.name}</ThemedText>
        <ThemedText family='source' style={styles.text}>Ready to create an event?</ThemedText>
      </View>
    </View>
  );
};



export default ProfileDisplay;
