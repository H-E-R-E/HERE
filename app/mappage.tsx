import React, { useEffect, useState } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import useThemeColors from "../app/hooks/useThemeColors";

const MapPage = () => {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const theme = useThemeColors();

  useEffect(() => {
    (async () => {
      // Ask permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      // Get current location
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.statusBar} translucent />
      {location ? (
        <MapView
        style={styles.map}
        initialRegion={{
            latitude: location?.latitude ?? 37.78825,
            longitude: location?.longitude ?? -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }}
        >
        {location && (
            <Marker coordinate={location} title="You are here" />
        )}
        </MapView>
      ) : (
        <View style={styles.map} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
});

export default MapPage;
