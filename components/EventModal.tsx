import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';
import { useRouter } from 'expo-router';

interface props {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function EventModal({ setModalVisible }: props) {
  const router = useRouter();

  return (
    <Modal
      visible={true} // since modal route is always visible
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)} // for android back button
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
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
        </TouchableWithoutFeedback>
      </View>
      </TouchableWithoutFeedback>
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
