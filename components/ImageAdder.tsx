import React, { useState } from 'react'
import { View, Text, StyleSheet, Image, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker';

const ImageAdder = () => {
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert(
                    "Permission Required",
                    "Permission to access camera roll is required to select images.",
                    [{ text: "OK" }]
                );
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            
            console.log(result);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert(
                "Error",
                "An error occurred while selecting the image. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <View>
            <View style={styles.imageWrapper}>
                {image && <Image source={{ uri: image }} style={styles.image} />}
                <Pressable onPress={pickImage} style={styles.iconButton}>
                    <Ionicons 
                        name="image-outline" 
                        size={25} 
                        color="#7851A9"
                        style={styles.icon} 
                    />
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    imageWrapper: {
        height: 200,
        width: 200,
        backgroundColor: "#E9E6EE", 
        marginTop: 40,
        marginBottom: 10,
        position: 'relative',
    },
    image: {
        width: 200,
        height: 200,
    },
    iconButton: {
        position: "absolute",
        top: 160,
        left: 150,
        padding: 10,
    },
    icon: {
   
    }
})

export default ImageAdder