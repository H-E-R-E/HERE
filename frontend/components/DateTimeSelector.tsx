import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather, Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import useThemeColors from '../app/hooks/useThemeColors';

interface Props {
  mode: "date" | "time";
  value: Date | null;
  onChange: (value: Date) => void;
  placeholder: string;
  iconName: "calendar-outline" | "time-outline"
}

export default function DateTimeSelector({ mode, value, onChange, placeholder, iconName }: Props) {
  const [show, setShow] = useState(false);
  const theme = useThemeColors();

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === "ios"); 
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    
    if (mode === "date") {
      return value.toLocaleDateString();
    } else {
      return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShow(true)}>
        <View  
          style={{
            backgroundColor: theme.inputBgColor,
            height: 65,
            borderRadius: 15,
            width: 150,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
          }}
        >
           <Ionicons
              name={iconName}
              size={14}
              color={value ? theme.text : theme.placeholderText}
            />
          
          <ThemedText
            style={{
              color: value ? theme.text : theme.placeholderText, 
              fontSize: 13,
            }}
          >
            {formatDisplayValue()}
          </ThemedText>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={value ? theme.text: theme.placeholderText}
          />
        </View>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          is24Hour
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}