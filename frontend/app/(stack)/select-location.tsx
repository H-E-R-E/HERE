import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import ThemedText from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import InputField from '../../components/InputField';
import { useEvent } from '../../context/EventContext';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../../app/hooks/useThemeColors";
import { StatusBar } from 'expo-status-bar';

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

  const { isPhysical, updatePhysicalEvent } = useEvent();
  const theme = useThemeColors();

  const goToDetails = (item: NominatimPlace) => {
    if (isPhysical) {
      updatePhysicalEvent({ longitude: parseInt(item.lon), latitude: parseInt(item.lat) });
      router.push("/physical-events");
    } 
  };

  const searchQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'HERE/1.0 (here@gmail.com)', 'Accept': 'application/json' }
      });

      if (!response.ok) {
        console.error("Fetch failed:", response.status);
        setResults([]);
        return;
      }

      const data = await response.json();
      const sortedArray = data.sort((a: NominatimPlace, b: NominatimPlace) => b.importance - a.importance)
      let finalArray;
      sortedArray.length > 3?  finalArray = sortedArray.slice(0, 4) : finalArray = sortedArray
      setResults(finalArray);
      console.log(results);
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    content: { flex: 1, padding: 20 },
    header: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 10, marginTop: 20 },
    backButton: { padding: 8 },
    headerText: { fontWeight: "800", fontSize: 16, flex: 1, textAlign: "center", marginRight: 40, color: theme.primary },
    inputContainer: { marginBottom: 10, marginHorizontal: 15 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: theme.primary, marginHorizontal: 10 },
    resultItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    resultText: { fontSize: 16, color: '#333' },
    emptyStateText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
  }), [theme]);

  const renderResultItem = ({ item }: { item: NominatimPlace }) => (
    <Pressable onPress={() => goToDetails(item)} style={styles.resultItem}>
      <ThemedText weight="regular" style={styles.resultText}>{item.display_name}</ThemedText>
    </Pressable>
  );

  const renderEmptyComponent = () => {
    if (isLoading) return <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />;
    if (query && !isLoading) return <ThemedText style={styles.emptyStateText}>No results found for "{query}"</ThemedText>;
    return null;
  };

  const handleBackPress = () => router.push(isPhysical ? "/physical-events" : "/virtual-events");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.statusBar} translucent />
      <View style={styles.content}>
        {/* Header */}
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
            inputStyle={{ borderRadius: 15, paddingRight: 20, }}
          />
        </View>

        {/* Nearest Location / Results */}
        <ThemedText style={styles.sectionTitle}>Nearest Location</ThemedText>

        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={renderResultItem}
          ListEmptyComponent={renderEmptyComponent}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SafeAreaView>
  );
}
