import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import {
  useFonts,
  SourceSans3_400Regular,
  SourceSans3_900Black
} from '@expo-google-fonts/source-sans-3';
import { useAuth } from '../context/AuthContext';

const ProfileDisplay = () => {
  const { user } = useAuth();
  const [fontsLoaded] = useFonts({
    SourceSans3_400Regular,
    SourceSans3_900Black,
  });


  if (!fontsLoaded) return null;



  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image
          source={require('../assets/images.png')}
          style={styles.avatar}
        />
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.text, {fontWeight: "800", fontSize: 18,}]}>Hello, {user?.name}</Text>
        <Text style={styles.text}>Ready to create an event?</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
  },
});

export default ProfileDisplay;
