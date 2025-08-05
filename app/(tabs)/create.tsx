import React, { useState } from "react";
import { View, Text, Image, Modal, StyleSheet, Button } from "react-native";
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
        
        <AnimatedButton onPress={() => setModalVisible(true)} width={300}>Create</AnimatedButton>

      <Modal
        visible={modalVisible}
        transparent={true} // so the background is see-through
        animationType="fade" // or "slide"
        onRequestClose={() => setModalVisible(false)} // Android back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{fontWeight: 'bold'}}>What Type?</Text>
            <AnimatedButton onPress={() => router.push("/physical-events")} width={250}>Physical</AnimatedButton>
            <Text style={{marginTop: 10}}>OR</Text>
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