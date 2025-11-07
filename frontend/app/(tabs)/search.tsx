import { View, Text, StyleSheet, FlatList } from 'react-native'
import React, { useMemo, useState } from 'react'
import useThemeColors from '../hooks/useThemeColors'
import InputField from '../../components/InputField'
import ThemedText from '../../components/ThemedText';


const DATA = [
  { id: '1', title: 'Events Near Me' },
  { id: '2', title: 'Sponsors' },
  { id: '3', title: 'Hosts' },
  { id: '4', title: 'Event Planners' },
  { id: '5', title: 'Media' },
];


const search = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const theme = useThemeColors();
    const styles = useMemo(() => 
        StyleSheet.create({
            container: {
                flex: 1,
                marginTop: 60

            },
            inputContainer: {
                alignItems: 'center',
                marginBottom: 10
            },
             item: {
                borderBottomColor: '#ccc',
                borderBottomWidth: 1,
                padding: 20,
                marginVertical: 8,
                marginHorizontal: 16,
            },
           

        }), [theme]
    )
      const handleChange = (text: string) => {
            setSearchQuery(text);
            };
    const Item = ({ title }: {title: string}) => (
    <View style={styles.item}>
         <ThemedText weight='semibold' style={{ color: theme.primary }}>{title}</ThemedText>
    </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <InputField 
            value={searchQuery}
            onChangeText={() => {handleChange(searchQuery)}}
            showSearchButton
            placeholder='Search'
        />
      </View>

    <FlatList
      data={DATA}
      renderItem={({ item }) => <Item title={item.title} />}
      keyExtractor={item => item.id}
    />
  </View>

  )
}

export default search