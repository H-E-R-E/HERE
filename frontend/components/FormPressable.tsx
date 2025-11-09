
import React, { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import useThemeColors from '../app/hooks/useThemeColors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface FormPressableProps {
  label: string;
  onPress: () => void;
  children?: React.ReactNode;
  width?: number;
  hasValue?: boolean;
  pressableStyles?: {};
  backgroundColor?: string;
  labelStyles?: {};
  showChevron?: boolean;
  showLeftIcon?: boolean;
  leftIconName?: IoniconName;
  leftIconSize?: number;
}

export default function FormPressable({ 
  label, 
  onPress, 
  children, 
  width = 320, 
  hasValue = false,
  backgroundColor,
  pressableStyles,
  labelStyles,
  showChevron = false,
  showLeftIcon = false,
  leftIconName = "calendar",
  leftIconSize = 18,
}: FormPressableProps) {
  
  const theme = useThemeColors();
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || theme.inputBgColor,
      width: width,
      height: 65,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    label: {
      fontSize: 13,
      color: hasValue ? theme.text : theme.placeholderText,
      fontFamily: 'Poppins',
      flex: 1,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 8,
    },
    childrenContainer: {
      transform: [{ scale: 0.85 }],
    },
  }), [theme, backgroundColor, width, hasValue]);

  return (
    <Pressable style={[styles.container, pressableStyles]} onPress={onPress}>
      <View style={styles.leftSection}>
        {showLeftIcon && (
          <Ionicons
            name={leftIconName}
            size={leftIconSize}
            color={hasValue ? theme.text : theme.placeholderText}
          />
        )}
        <ThemedText style={[styles.label, labelStyles]}>{label}</ThemedText>
      </View>
      
      <View style={styles.rightSection}>
        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.placeholderText}
          />
        )}
      </View>
    </Pressable>
  );
}
