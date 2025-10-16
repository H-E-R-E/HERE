import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import ThemedText from './ThemedText';

interface FormPressableProps {
  label: string;
  onPress: () => void;
  children?: React.ReactNode;
  width?: number;
  paddingVert?: number;
  hasValue?: boolean; 
  pressableStyles?: {},
  backgroundColor?: string
  labelStyles?: {}// New prop to indicate if there's a value
}

export default function FormPressable({ 
  label, 
  onPress, 
  children, 
  width = 300, 
  paddingVert = 18,
  hasValue = false,
  backgroundColor = '#E9E6EE',
  pressableStyles,
  labelStyles
}: FormPressableProps) {
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor,
      width: width,
      borderRadius: 15,
      paddingVertical: paddingVert,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 5,
    },
    label: {
      fontSize: 13,
      color: hasValue ? '#000000' : '#00000059', 
      flex: 1,
    },
  });

  return (
    <Pressable style={[styles.container, pressableStyles, labelStyles]} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </Pressable>
  );
}
