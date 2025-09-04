import { View, StyleSheet, ScrollView, SafeAreaView, Pressable } from "react-native";
import ThemedText from '../components/ThemedText';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEvent } from "../context/EventContext";
import { Ionicons } from "@expo/vector-icons";
import useThemeColors from "./hooks/useThemeColors";
import React, { useMemo } from "react";

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const { events } = useEvent();
  const router = useRouter();
  const theme = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#666',
      width: 100,
    },
    value: {
      fontSize: 16,
      color: '#333',
      flex: 1,
    },
    description: {
      fontSize: 16,
      color: '#333',
      marginVertical: 20,
      lineHeight: 24,
    },
    notFound: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    notFoundText: {
      fontSize: 18,
      color: '#666',
    }
  }), [theme]);

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <View style={styles.notFound}>
        <ThemedText weight="regular" style={styles.notFoundText}>Event not found.</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </Pressable>
        <ThemedText weight="semibold" style={[styles.value, { textAlign: 'center' }]}>Event Details</ThemedText>
      </View>
      <ScrollView style={styles.content}>
        <ThemedText weight="bold" style={styles.title}>{event.title}</ThemedText>
        
        <View style={styles.infoRow}>
          <ThemedText weight="semibold" style={styles.label}>Date:</ThemedText>
          <ThemedText weight="regular" style={styles.value}>{event.date || "Not set"}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText weight="semibold" style={styles.label}>Time:</ThemedText>
          <ThemedText weight="regular" style={styles.value}>{event.time || "Not set"}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText weight="semibold" style={styles.label}>Location:</ThemedText>
          <ThemedText weight="regular" style={styles.value}>{event.location || "Not set"}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText weight="semibold" style={styles.label}>Fee:</ThemedText>
          <ThemedText weight="regular" style={styles.value}>{event.eventFee || "Free"}</ThemedText>
        </View>

        <ThemedText weight="regular" style={styles.description}>{event.description || "No description available"}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}
