import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Pressable, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';
import users from "./users.json"
import useThemeColors from './hooks/useThemeColors';

type searchReturn = {
    id: number
    name: string
}

export default function AddCoHost() {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<searchReturn[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const theme = useThemeColors();
    const router = useRouter();

    function goToDetails(item: searchReturn) {
        router.push({
            pathname: '/physical-events',
            params: {
                cohosts: JSON.stringify(item),
            },
        });
    }

    function addCoHost() {
        
    }

    //still in the works...
    async function searchQuery() {
        if (!query.trim()) {
            console.log("Empty query, skipping search");
            return;
        }
        setIsLoading(true);
        try {
            console.log("Search results:", users);
            setResults(users.filter((u) => u.name.toLowerCase().includes(query.trim().toLowerCase())))
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    //Just to check.
    useEffect(() => {
        console.log("Updated results:", results);
    }, [results]);


    return (
        <SafeAreaView style={{ flex: 1, marginVertical: 20 }}>
            <StatusBar barStyle={"dark-content"} />
            <View style={{ flex: 1, padding: 20 }}>

                <View style={{ marginBottom: 15, alignItems: 'center' }}>
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
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ flexGrow: 1 }}
                    renderItem={({ item }) => (
                        
                            <View style={{
                                height: 75,
                                width: 350,
                                boxShadow: [{
                                    offsetX: 0,
                                    offsetY: 1,
                                    blurRadius: 1,
                                    spreadDistance: 0,
                                    color: '#00000040',
                            }],
                                backgroundColor: "#ffffff",
                                borderRadius: 15,
                                marginBottom: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 15,
                            }}>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                height: 40,
                                width: 40,
                                borderRadius: 10,
                                boxShadow: [{
                                    offsetX: 0,
                                    offsetY: 2,
                                    blurRadius: '2px',
                                    spreadDistance: '0px',
                                    color: '#00000040',
                                }]
                            }} 
                            />

                            <Text style={{ fontSize: 12, marginLeft: 10 }}>{item.name}</Text>
                            </View>
                            
                            <Pressable 
                            style={{ 
                                backgroundColor: theme.primary,
                                borderRadius: 10, 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                width: 60, 
                                height: 25 
                                }}
                                onPress={() => goToDetails(item)}
                                >
                                    <Text 
                                    style={{ 
                                        color: "#ffffff", 
                                        fontSize: 8, 
                                        }}>
                                            Add
                                    </Text>
                            </Pressable>
                            </View>
                    )}
                    ListEmptyComponent={() => (
                        query && !isLoading ? (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                                No results found for "{query}"
                            </Text>
                        ) : null
                    )}
                    style={{}}
                />
            </View>
        </SafeAreaView>
    );


}