import React, { useState, useMemo } from 'react';
import { View, FlatList, Text, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';

type NominatimPlace = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    importance: number;
    [key: string]: any;
};

export default function SelectLocation() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<NominatimPlace[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const goToDetails = (item: NominatimPlace) => {
        router.push({
            pathname: '/physical-events',
            params: {
                place: JSON.stringify(item.display_name),
            },
        });
    };

    const searchQuery = async () => {
        if (!query.trim()) {
            console.log("Empty query, skipping search");
            return;
        }

        console.log("Searching for:", query);
        setIsLoading(true);
        
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'HERE/1.0 (here@gmail.com)', 
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch failed:", response.status, errorText);
                return;
            }
            
            const data = await response.json();
            const sortedData = data.sort((a: NominatimPlace, b: NominatimPlace) => 
                b.importance - a.importance
            );
            
            setResults(sortedData);
            console.log("Search results:", data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            marginVertical: 20,
        },
        content: {
            flex: 1,
            padding: 20,
            alignItems: "center",
        },
        inputContainer: {
            flexDirection: 'row',
            marginBottom: 20,
        },
        resultItem: {
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
        },
        resultText: {
            fontSize: 16,
            color: '#333',
        },
        emptyStateText: {
            textAlign: 'center',
            marginTop: 20,
            color: '#666',
            fontSize: 14,
        },
    }), []);

    const renderResultItem = ({ item }: { item: NominatimPlace }) => (
        <Pressable 
            onPress={() => goToDetails(item)}
            style={styles.resultItem}
        >
            <Text style={styles.resultText}>{item.display_name}</Text>
        </Pressable>
    );

    const renderEmptyComponent = () => {
        if (query && !isLoading) {
            return (
                <Text style={styles.emptyStateText}>
                    No results found for "{query}"
                </Text>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <InputField
                        placeholder='Search Location'
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
                    keyExtractor={(item) => item.place_id.toString()}
                    renderItem={renderResultItem}
                    ListEmptyComponent={renderEmptyComponent}
                />
            </View>
        </SafeAreaView>
    );
}