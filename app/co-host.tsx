import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, Pressable, Button, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';

interface searchReturn {
    username : string
}
export default function AddCoHost() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<searchReturn[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    function goToDetails(item: searchReturn) {
        router.push({
            pathname: '/physical-events',
            params: {
                place: JSON.stringify(item),
            },
        });
    }

    async function searchQuery() {
        if (!query.trim()) {
            console.log("Empty query, skipping search");
            return;
        }
        setIsLoading(true);
        const url = "backend(users)";
        try {
            const response = await fetch(url)
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch failed:", response.status, errorText);
                return;
            }
            const data = await response.json();
            console.log("Search results:", data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, marginVertical: 20 }}>
            <View style={{ flex: 1, padding: 20, alignItems: "center"}}>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>

                    <InputField
                        placeholder='Add Co-host'
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={searchQuery}
                        returnKeyType="search"
                        showSearchButton={true}
                        onSearchPress={searchQuery}
                    />


                </View>

                <FlatList
                    data={results}
                    keyExtractor={(item) => item.toString()}
                    renderItem={({ item }) => (
                        <Pressable 
                            onPress={() => goToDetails(item)}
                            style={{
                                padding: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: '#eee',
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>{item.username}</Text>
                        </Pressable>
                    )}
                    ListEmptyComponent={() => (
                        query && !isLoading ? (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                                No results found for "{query}"
                            </Text>
                        ) : null
                    )}
                />
            </View>
        </SafeAreaView>
    );


}