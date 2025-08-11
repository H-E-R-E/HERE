import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';
import { useRouter } from 'expo-router';

export default function EventModal() {
  const router = useRouter();

  return (
    <Modal
      visible={true} // modal route is always visible
      transparent
      animationType="fade"
      onRequestClose={() => router.back()} // Android back button
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={10} // makes it easier to tap
          >
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>

          <Text style={{ fontWeight: 'bold', marginBottom: 15 }}>What Type?</Text>
          
          <AnimatedButton
            onPress={() => router.push('/physical-events')}
            width={250}
          >
            Physical
          </AnimatedButton>

          <Text style={{ marginTop: 10 }}>OR</Text>

          <AnimatedButton
            onPress={() => router.push('/virtual-events')}
            width={250}
          >
            Virtual
          </AnimatedButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative', // so close button is positioned inside
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 4,
  },
});
