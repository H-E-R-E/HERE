import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Text } from "react-native";
import * as Location from "expo-location";
import useThemeColors from "./hooks/useThemeColors";

MapboxGL.setAccessToken("pk.eyJ1IjoidHJlYS1zdXJlIiwiYSI6ImNtZzh1Zm1iZDA0bHoya3F0eTR2NGM2azYifQ.biSfMvMbfZ0-amWFhrReOA");

const MapPage = () => {
  const [location, setLocation] = useState<[number, number]>([0, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const theme  = useThemeColors();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission denied");
        setLoading(false);
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation([location.coords.longitude, location.coords.latitude]);
      setLoading(false);
    })();

  }, []);

    if (loading) {
      return(
      <View style={styles.loader}>
      <ActivityIndicator size="large" color={theme.primary}/>
      </View>
      )
    }

    if (errorMsg) {
      return (
        <View style={styles.loader}>
          <Text>{errorMsg}</Text>
        </View>
      );
    }

  return (
    <View style={styles.page}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
      >
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={location}
        />
        <MapboxGL.PointAnnotation id="me" coordinate={location}><Text>Me</Text></MapboxGL.PointAnnotation>
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MapPage;
