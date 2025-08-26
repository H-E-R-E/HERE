import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, Text, Pressable, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import InputField from '../components/InputField';
import users from '.././data/users.json';
import useThemeColors from './hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from '../context/EventContext';

type SearchReturn = {
  id: string;
  name: string;
};

export default function AddCoHost() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { physicalEvent, virtualEvent, updatePhysicalEvent, updateVirtualEvent, isPhysical } = useEvent();
  const theme = useThemeColors();
  const router = useRouter();

  // Determine current event type
  const event = isPhysical ? physicalEvent : virtualEvent;
  const updateEvent = isPhysical ? updatePhysicalEvent : updateVirtualEvent;

  const [hostSet, setHostSet] = useState<Set<string>>(new Set(event?.cohosts ?? []));


  useEffect(() => {
    setHostSet(new Set(event?.cohosts ?? []));
  }, [event?.cohosts]);

    useEffect(() => {
      console.log(isPhysical);
  }, []);
  
  const goToDetails = () => {
    console.log(isPhysical);
    router.push(isPhysical ? '/physical-events' : '/virtual-events');
  };

  const searchQuery = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const q = query.trim().toLowerCase();
      const filtered = users.filter(u => u.name.toLowerCase().includes(q));
      setResults(filtered);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsLoading(false);
    }
  };  

  const addCoHost = (id: string) => {
    setHostSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      updateEvent({ ...event, cohosts: Array.from(next) });
      return next;
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, marginVertical: 20 },
        content: { flex: 1, padding: 20 },
        inputContainer: { marginBottom: 15, alignItems: 'center', flexDirection: 'row', gap: 10 },
        flatListContainer: { flexGrow: 1 },
        resultItem: {
          height: 75,
          width: 350,
          backgroundColor: '#ffffff',
          borderRadius: 15,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 1,
          elevation: 2,
        },
        userInfo: { flexDirection: 'row', alignItems: 'center' },
        avatar: {
          height: 40,
          width: 40,
          borderRadius: 10,
          backgroundColor: '#f0f0f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 2,
          elevation: 2,
        },
        userName: { fontSize: 12, marginLeft: 10, color: '#333' },
        buttonBase: {
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          width: 60,
          height: 25,
        },
        addButton: { backgroundColor: theme.primary },
        addedButton: { backgroundColor: '#493752ff' },
        addButtonText: { color: '#ffffff', fontSize: 8, fontWeight: '500' },
        emptyStateText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
      }),
    [theme.primary]
  );

  const renderResultItem = ({ item }: { item: SearchReturn }) => {
    const id = item.id.toString();
    const isAdded = hostSet.has(id);

    return (
      <View style={styles.resultItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatar} />
          <Text style={styles.userName}>{item.name}</Text>
        </View>

        <Pressable
          style={[styles.buttonBase, isAdded ? styles.addedButton : styles.addButton]}
          onPress={() => addCoHost(id)}
        >
          <Text style={styles.addButtonText}>{isAdded ? 'Added' : 'Add'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (query && !isLoading) {
      return <Text style={styles.emptyStateText}>No results found for "{query}"</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Ionicons name="arrow-back-outline" size={24} color="black" onPress={goToDetails} />
          <InputField
            placeholder="Add Co-host"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchQuery}
            returnKeyType="search"
            showSearchButton
            onSearchPress={searchQuery}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.flatListContainer}
          renderItem={renderResultItem}
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>
    </SafeAreaView>
  );
}
