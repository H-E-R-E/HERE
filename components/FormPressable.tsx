import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  width: number;
  children?: React.ReactNode;
}

export default function FormPressable({ label, onPress, width, children }: Props) {
  return (
    <View style={[styles.container, { width }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.contentRow}>
        <Text style={styles.label}>{label}</Text>
        {children}
        </View>

      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  pressable: {
    backgroundColor: '#E9E6EE',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    height: 65,

    
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: "#5c5c5dff",
    fontSize: 16,
  },
  contentRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

});
