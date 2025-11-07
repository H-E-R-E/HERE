import React, { useMemo, useState } from 'react';
import { View, Pressable, Image, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import useThemeColors from '../app/hooks/useThemeColors';

type ImageAdderProps = {
  onImageSelected?: (uri: string) => void;
};

const ImageAdder: React.FC<{ onImageSelected?: (uri: string) => void }> = ({ onImageSelected }) => {
  const [image, setImage] = useState<string | undefined>(undefined);
  const theme = useThemeColors();

  const styles = useMemo(() => 
  StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  imageWrapper: {
    width: 200,
    height: 200,
    borderRadius: 15,
    backgroundColor: theme.inputBgColor,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // ensures borderRadius works
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    padding: 10,
    borderRadius: 20,
  },
}), [theme])

const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
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

      if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onImageSelected?.(uri); 
    }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="contain" // makes sure the image fits without cropping
          />
        )}
        <Pressable onPress={pickImage} style={styles.iconButton}>
          <Ionicons name="image-outline" size={25} color="#7851A9" />
        </Pressable>
      </View>
    </View>
  );
};



export default ImageAdder;