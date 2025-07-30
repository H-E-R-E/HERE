import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, Text } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; // Import DateTimePickerEvent
import { Feather } from '@expo/vector-icons';
interface Props {
  mode: 'date' | 'time'; // pass whether you want a date or time picker
  onChange: (value: Date) => void;
  placeholder: string;
}

export default function DateTimeSelector({ mode, onChange, placeholder }: Props) {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate !== undefined) {
      const currentDate = selectedDate;
      setShow(Platform.OS === 'ios'); // On iOS, the picker doesn't automatically close, so we hide it programmatically.
      setDate(currentDate);
      onChange(currentDate); // Pass the selected date/time to parent.
  
    } else {
      // If selectedDate is undefined (user canceled), hide the picker for iOS
      // For Android, it usually closes automatically on cancel
      setShow(Platform.OS === 'ios' ? false : show);
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
    <Text style={{ color: "#5c5c5dff" }}>{placeholder}</Text>
    <Feather name="chevron-right" size={20} color="#5c5c5dff" />
  </View>
</TouchableOpacity>



      {show && (
        <DateTimePicker
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}