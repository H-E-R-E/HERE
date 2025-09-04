import React, { useState } from "react";
import { View, Image, Modal, StyleSheet, Button, Pressable } from "react-native";
import ThemedText from '../../components/ThemedText';
import BlurryEllipse from "../../components/BlurryEllipse";
import AnimatedButton from "../../components/AnimatedButton";
import { useRouter } from "expo-router";
import SvgPicEventPage from "../../components/SvgPicEventPage";
export default function Create() {

    const router = useRouter();

    const [modalVisible, setModalVisible] = useState(false);
    return (
     <View style={{flex: 1,}}>
        <BlurryEllipse></BlurryEllipse>
    <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <SvgPicEventPage />
        
        <Pressable style={{ marginTop: 30 }}>
          <ThemedText weight="semibold" style={{ color: "#7851A9" }}>Create an event to save him!!</ThemedText>
          </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true} // so the background is see-through
        animationType="fade" // or "slide"
        onRequestClose={() => setModalVisible(false)} // Android back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText weight="bold" style={{}}>What Type?</ThemedText>
            <AnimatedButton onPress={() => router.push("/physical-events")} width={250}>Physical</AnimatedButton>
            <ThemedText weight="regular" style={{marginTop: 10}}>OR</ThemedText>
            <AnimatedButton onPress={() => router.push("/virtual-events")} width={250}>Virtual</AnimatedButton>
          </View>
        </View>
      </Modal>

    </View>
    </View>
    )

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
  },
})