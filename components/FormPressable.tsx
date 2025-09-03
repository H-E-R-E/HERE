import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  width: number;
  children?: React.ReactNode;
  paddingVert?: number;
  containerStyle?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function FormPressable({
  label,
  onPress,
  width,
  children,
  paddingVert,
  containerStyle,
  pressableStyle,
  labelStyle,
}: Props) {
  return (
    <View style={[styles.container, { width }, containerStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressableStyle,
          { paddingVertical: paddingVert || 22 },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.contentRow}>
          <Text style={[styles.label, labelStyle]}>{label}</Text>
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
    color: '#00000059',
    fontSize: 13,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
