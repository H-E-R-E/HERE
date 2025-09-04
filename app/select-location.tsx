import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import ThemedText from '../components/ThemedText';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';
import { useEvent } from '../context/EventContext';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../app/hooks/useThemeColors"
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

    const { isPhysical, updatePhysicalEvent, updateVirtualEvent } = useEvent();

    const theme = useThemeColors();
    const goToDetails = (item: NominatimPlace) => {
        if (isPhysical) {
            updatePhysicalEvent({ location: item.display_name });
            router.push("/physical-events");
        } else {
            updateVirtualEvent({ location: item.display_name });
            router.push("/virtual-events");
        }
        
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
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            paddingHorizontal: 10,
            marginBottom: 10,
        },
        backButton: { padding: 8 },
        headerText: {
            fontWeight: "800",
            fontSize: 12,
            flex: 1,
            textAlign: "center",
            marginRight: 40,
            color: theme.primary,
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
    }), [theme]);

    const renderResultItem = ({ item }: { item: NominatimPlace }) => (
        <Pressable 
            onPress={() => goToDetails(item)}
            style={styles.resultItem}
        >
            <ThemedText weight="regular" style={styles.resultText}>{item.display_name}</ThemedText>
        </Pressable>
    );

    const renderEmptyComponent = () => {
        if (query && !isLoading) {
            return (
                <ThemedText weight="regular" style={styles.emptyStateText}>
                    No results found for "{query}"
                </ThemedText>
            );
        }
        return null;
    };

    const handleBackPress = () => {
        if (isPhysical) {
            router.push("/physical-events");
        } else {
            router.push("/virtual-events");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </Pressable>
                    <ThemedText weight="bold" style={styles.headerText}>Select Location</ThemedText>
                </View>
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
                <View><ThemedText weight="bold" style={{ fontSize: 12, flex: 1 }}>Nearest Location</ThemedText></View>

            <FlatList
                data={results}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={renderResultItem}
                ListEmptyComponent={renderEmptyComponent}
                style={{ flex: 1 }}
            />
            </View>
        </SafeAreaView>
    );
}