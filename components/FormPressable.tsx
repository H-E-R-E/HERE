import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  width: number;
  children?: React.ReactNode;
  paddingVert?: number;
}

export default function FormPressable({ label, onPress, width, children, paddingVert }: Props) {
  return (
    <View style={[styles.container, { width }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
          {paddingVertical: paddingVert || 22}
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
    marginVertical: 7,
  },
  pressable: {
    backgroundColor: '#E9E6EE',
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: "#00000059",
    fontSize: 13,
  },
  contentRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

});
