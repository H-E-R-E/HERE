import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from "react-native";
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
        <Text style={styles.notFoundText}>Event not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </Pressable>
        <Text style={[styles.value, { textAlign: 'center' }]}>Event Details</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{event.date || "Not set"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{event.time || "Not set"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{event.location || "Not set"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Fee:</Text>
          <Text style={styles.value}>{event.eventFee || "Free"}</Text>
        </View>

        <Text style={styles.description}>{event.description || "No description available"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
