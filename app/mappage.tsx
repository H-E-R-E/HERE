import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import MapView, { Marker, UrlTile, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import useThemeColors from "../app/hooks/useThemeColors";
import InputField from "../components/InputField";
import { router, useLocalSearchParams } from "expo-router";

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
  [key: string]: any;
};

const MapPage = () => {
   const { xlocation } = useLocalSearchParams();  
    const [results, setResults] = useState<NominatimPlace[]>([]);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null); //LOOK HERE
    const [isLoading, setIsLoading] = useState(false);
    const theme = useThemeColors();
    const params = useLocalSearchParams();
    

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


    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1 },
        map: { width: "100%", height: "100%" },
        input: { borderRadius: 15, paddingRight: 20, position: 'absolute', top: 40, right: 20 }

    }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.statusBar} translucent />
      <InputField
                placeholder='Search Location'
                value={""}
                onChangeText={() => {}}
                onClick={() => {() => router.push('/select-location')}}
                returnKeyType="search"
                showSearchButton={true}
              
                inputStyle={styles.input}
              />
              
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
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          ></UrlTile>
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
export default MapPage;
