import { View, TextInput, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const dummyPlaces = ['Lagos', 'Abuja', 'New York', 'London'];

export default function SelectLocation() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = dummyPlaces.filter(place =>
    place.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Search for a location"
        value={query}
        onChangeText={setQuery}
        style={{
          padding: 10,
          borderWidth: 1,
          borderRadius: 8,
          marginBottom: 20,
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.push({ pathname: '/physical-events', params: { selectedLocation: item } });
            }}
          >
            <Text style={{ padding: 10 }}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
