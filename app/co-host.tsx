import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, Text, Pressable, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';
import users from "./users.json";
import useThemeColors from './hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

type SearchReturn = {
    id: number;
    name: string;
};

export default function AddCoHost() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchReturn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hostSet, setHostSet] = useState<Set<string>>(new Set());
//Sets are for fast lookup , yk, if it's added or not.
    const theme = useThemeColors();
    const router = useRouter();
    //const { useAuth } = 

    const goToDetails = (item: SearchReturn) => {
        router.push({
            pathname: '/physical-events',
            params: {
                cohosts: JSON.stringify(item),
            },
        });
    };

    const searchQuery = async () => {
        if (!query.trim()) {
            console.log("Empty query, skipping search");
            return;
        }
        
        setIsLoading(true);
        try {
            console.log("Search results:", users);
            const filteredUsers = users.filter((user) => 
                user.name.toLowerCase().includes(query.trim().toLowerCase())
            );
            setResults(filteredUsers);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    //function to add/remove cohost from cohost list (set)
    const addCoHost = (id: string, name: string) => {
    setHostSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        console.log(`Removed ${id} : ${name}`)

      } else {
        newSet.add(id);
         console.log(`Added ${id} : ${name}`)
      }
      return newSet;
    });
    }

    useEffect(() => {
        console.log("Updated results:", results);
    }, [results]);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            marginVertical: 20,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        inputContainer: {
            marginBottom: 15,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 10,
        },
        flatListContainer: {
            flexGrow: 1,
        },
        resultItem: {
            height: 75,
            width: 350,
            backgroundColor: "#ffffff",
            borderRadius: 15,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 15,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.25,
            shadowRadius: 1,
            elevation: 2, // For Android shadow
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatar: {
            height: 40,
            width: 40,
            borderRadius: 10,
            backgroundColor: '#f0f0f0', // Placeholder background
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 2,
            elevation: 2,
        },
        userName: {
            fontSize: 12,
            marginLeft: 10,
            color: '#333',
        },
        addButton: {
            backgroundColor: theme.primary,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 25,
        },

        addedButton: {
            backgroundColor: "#493752ff"
        },
        addButtonText: {
            color: "#ffffff",
            fontSize: 8,
            fontWeight: '500',
        },
        emptyStateText: {
            textAlign: 'center',
            marginTop: 20,
            color: '#666',
            fontSize: 14,
        },
    }), [theme.primary]);

    const renderResultItem = ({ item }: { item: SearchReturn }) => {

        const isAdded = hostSet.has(item.id.toString());

        return (
        <View style={styles.resultItem}>
            <View style={styles.userInfo}>
                <View style={styles.avatar} />
                <Text style={styles.userName}>{item.name}</Text>
            </View>
            
            <Pressable 
                style={[styles.addButton, isAdded? styles.addedButton : styles.addButton]}
                onPress={() => addCoHost(item.id.toString(), item.name)}
            >
                <Text style={styles.addButtonText}>{isAdded? "Added" : "Add"}</Text>
            </Pressable>
        </View>
        )
    }

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
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <Ionicons name="arrow-back-outline" size={24} color="black" />
                    <InputField
                        placeholder="Add Co-host"
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
                    contentContainerStyle={styles.flatListContainer}
                    renderItem={renderResultItem}
                    ListEmptyComponent={renderEmptyComponent}
                />
            </View>
        </SafeAreaView>
    );
}