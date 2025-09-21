import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import ThemedText from './ThemedText';

interface Props {
  mode: "date" | "time";
  value: Date | null;
  onChange: (value: Date) => void;
  placeholder: string;
}

export default function DateTimeSelector({ mode, value, onChange, placeholder }: Props) {
  const [show, setShow] = useState(false);

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
            backgroundColor: "#E9E6EE",
            height: 65,
            borderRadius: 15,
            width: 150,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
          }}
        >
          <ThemedText
            style={{
              color: value ? "#000000" : "#00000059", 
              fontSize: 13,
            }}
          >
            {formatDisplayValue()}
          </ThemedText>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={value ? "#000000" : "#00000059"}
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