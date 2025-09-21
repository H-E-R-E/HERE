import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';
import { useRouter } from 'expo-router';
import ThemedText from './ThemedText';
import useThemeColors from '../app/hooks/useThemeColors';

interface props {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function EventModal({ setModalVisible }: props) {
  const router = useRouter();
  const theme = useThemeColors();
  return (
    <Modal
      visible={true} // since modal route is always visible
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)} // for android back button
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.header}>
        <ThemedText weight='bold' style={{ color: theme.primary }}>What Type?</ThemedText>
          <Pressable
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
            hitSlop={10} 
          >
            <Ionicons name="close" size={24} color={theme.primary} />
          </Pressable>


          
          </View>

          <AnimatedButton
            onPress={() => router.push('/physical-events')}
            width={250}
          >
            Physical
          </AnimatedButton>

          <ThemedText style={{ color: theme.primary }}>OR</ThemedText>

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
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 4,
  },

  header: {
    paddingVertical: 20,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
    width: 280
  }
});
