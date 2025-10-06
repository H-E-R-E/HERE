import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import MapboxGL from "@rnmapbox/maps";
import { Text } from "react-native";
import * as Location from "expo-location";
import useThemeColors from "../hooks/useThemeColors";
import CentralModal from "../../components/CentralModal";
import AnimatedButton from "../../components/AnimatedButton";
import ThemedText from "../../components/ThemedText";
import { Feature } from "geojson";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

MapboxGL.setAccessToken("pk.eyJ1IjoidHJlYS1zdXJlIiwiYSI6ImNtZzh1Zm1iZDA0bHoya3F0eTR2NGM2azYifQ.biSfMvMbfZ0-amWFhrReOA");

interface Coords {
  longitude: number;
  latitude: number;
}

const MapPage = () => {
  const [location, setLocation] = useState<[number, number]>([0, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isdrawableMapView, setIsDrawableMapView] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoPolygon, setGeoPolygon] = useState<number[][]>([]);
  const [showPauseStopButtons, setshowPauseStopButtons] = useState(false);
  const [isPhysicalStartModalVisible, setIsPhysicalStartModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false)
  const [physicalPolygon, setPhysicalPolygon] = useState<Feature | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const theme = useThemeColors();
  const router = useRouter();

  const styles = useMemo(() => StyleSheet.create({
    page: { 
      flex: 1 
    },
    map: { 
      flex: 1 
    },
    loader: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    markerContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    marker: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "red",
      borderWidth: 2,
      borderColor: "#000000",
    },
    drawControls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    backButton: {
      position: 'absolute',
      top: 40,
      left: 40,
      zIndex: 1,
      color: theme.primary
    },
    trackingControls: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    }
  }), [theme]);



  useEffect(() => {
    (async () => {
      console.log('🗺️ MapPage: Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🗺️ MapPage: Permission status:', status);
      
      if (status !== "granted") {
        console.error('❌ MapPage: Location permission denied');
        setErrorMsg("Permission denied");
        setLoading(false);
        return;
      }

      console.log('🗺️ MapPage: Getting current position...');
      let location = await Location.getCurrentPositionAsync({});
      console.log('📍 MapPage: Current location acquired:', {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        accuracy: location.coords.accuracy
      });
      
      setLocation([location.coords.longitude, location.coords.latitude]);
      setLoading(false);
    })();
  }, []);

  function handleSetVirtualGeofencing() {
    console.log('🎯 MapPage: Virtual geofencing mode selected');
    setIsModalVisible(false);
    setIsDrawableMapView(true);
  }

  function handleSetPhysicalGeofencing() {
    console.log('🚶 MapPage: Physical geofencing mode selected');
    setIsModalVisible(false);
    setIsPhysicalStartModalVisible(true);
  }

  async function handlePhysicalTracking() {
    try {
      console.log('▶️ MapPage: Starting physical tracking...');
      setIsPhysicalStartModalVisible(false);
      setshowPauseStopButtons(true);
      
      let first = await Location.getCurrentPositionAsync({});
      let location = [first.coords.longitude, first.coords.latitude];
      console.log('📍 MapPage: First tracking point:', {
        longitude: location[0],
        latitude: location[1]
      });
      
      setGeoPolygon([location]);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (loc) => {
          console.log('📍 MapPage: New position tracked:', {
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
            accuracy: loc.coords.accuracy
          });
          setGeoPolygon((prev) => [...prev, [loc.coords.longitude, loc.coords.latitude]]);
        }
      );
      
      console.log('✅ MapPage: Physical tracking started successfully');
    } catch (error) {
      console.error('❌ MapPage: Error starting physical tracking:', error);
    }
  }

  const pauseTracking = () => {
    console.log('⏸️ MapPage: Pausing tracking...');
    setIsPaused(true);
    
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
      console.log('✅ MapPage: Tracking paused, current points:', geoPolygon.length);
    }
  };

  const resumeTracking = async() => {
    try {
      console.log('▶️ MapPage: Resuming tracking...');
      setIsPaused(false);
      
      if (!watchRef.current) {
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 1,
          },
          (loc) => {
            console.log('📍 MapPage: Position tracked (resumed):', {
              longitude: loc.coords.longitude,
              latitude: loc.coords.latitude
            });
            setGeoPolygon((prev) => [...prev, [loc.coords.longitude, loc.coords.latitude]]);
          }
        );
        console.log('✅ MapPage: Tracking resumed');
      }
    } catch (error) {
      console.error('❌ MapPage: Error resuming tracking:', error);
    }
  }

  const finishTracking = () => {
    console.log('⏹️ MapPage: Finishing tracking...');
    console.log('📊 MapPage: Total points tracked:', geoPolygon.length);
    
    pauseTracking();
    
    if (geoPolygon.length < 3) {
      console.warn('⚠️ MapPage: Not enough points for polygon (need at least 3, got', geoPolygon.length, ')');
      return;
    }

    const closedPolygon = [...geoPolygon, geoPolygon[0]];
    console.log('📐 MapPage: Creating polygon with', closedPolygon.length, 'points (including closure)');

    const physicalPolygonFeature: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [closedPolygon],
      },
    };

    console.log('✅ MapPage: Physical polygon created:', physicalPolygonFeature);
    console.log('📍 MapPage: Polygon coordinates:', closedPolygon);
    
    setPhysicalPolygon(physicalPolygonFeature);
    setshowPauseStopButtons(false);
    return physicalPolygonFeature;
  };

  const handleMapPress = (event: any) => {
    if (!isdrawableMapView) return;
    
    const [longitude, latitude] = event.geometry.coordinates as [number, number];
    console.log('👆 MapPage: Point added to virtual polygon:', { longitude, latitude });
    console.log('📊 MapPage: Total points:', geoPolygon.length + 1);
    
    setCoords({ longitude, latitude });
    setGeoPolygon((prev) => [...prev, [longitude, latitude]]);
  };

  const virtualPolygonFeature: Feature | null =
    geoPolygon.length > 2
      ? {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[...geoPolygon, geoPolygon[0]]],
          },
        }
      : null;

  if (loading) {
    return (
      <>
        <StatusBar style={theme.statusBar} translucent />  
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </>
    );
  }

  if (errorMsg) {
    return (
      <>
        <StatusBar style={theme.statusBar} translucent />  
        <View style={styles.loader}>
          <Text>{errorMsg}</Text>
        </View>
      </>
    );
  }

  return isdrawableMapView ? (
    <>
      <StatusBar style={theme.statusBar} translucent />  
      <View style={styles.page}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          onPress={handleMapPress}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <MapboxGL.Camera zoomLevel={14} centerCoordinate={location} />
          <MapboxGL.PointAnnotation id="marker1" coordinate={location}>
            <View style={styles.marker} />
          </MapboxGL.PointAnnotation>

          {geoPolygon.map((point, index) => (
            <MapboxGL.PointAnnotation
              key={`point-${index}`}
              id={`point-${index}`}
              coordinate={point as [number, number]}
            >
              <View style={[styles.marker, { backgroundColor: "blue" }]} />
            </MapboxGL.PointAnnotation>
          ))}
          
          {virtualPolygonFeature && (
            <MapboxGL.ShapeSource id="polygonSource" shape={virtualPolygonFeature}>
              <MapboxGL.FillLayer
                id="polygonFill"
                style={{ fillColor: "rgba(0, 150, 255, 0.3)" }}
              />
              <MapboxGL.LineLayer
                id="polygonLine"
                style={{ lineColor: "rgba(0, 150, 255, 0.8)", lineWidth: 2 }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>

        <View style={styles.drawControls}>
          <AnimatedButton
            onPress={() => {
              console.log('🗑️ MapPage: Clearing virtual polygon');
              setGeoPolygon([]);
              setCoords(null);
            }}
            width={120}
            buttonStyles={{ marginRight: 10 }}
          >
            Clear
          </AnimatedButton>
          <AnimatedButton
            onPress={() => {
              if (geoPolygon.length > 2) {
                console.log('✅ MapPage: Virtual polygon finished');
                console.log('📊 MapPage: Total points:', geoPolygon.length);
                console.log('📍 MapPage: Polygon coordinates:');
                geoPolygon.forEach((point, index) => {
                  console.log(`   Point ${index + 1}: [${point[0]}, ${point[1]}]`);
                });
                
                setIsDrawableMapView(false);
                alert(`Polygon created with ${geoPolygon.length} points`);
              } else {
                console.warn('⚠️ MapPage: Need at least 3 points to finish (currently have', geoPolygon.length, ')');
              }
            }}
            width={120}
          >
            Finish
          </AnimatedButton>
        </View>
      </View>
    </>
  ) : (
    <>
      <StatusBar style={theme.statusBar} translucent />  
      <View style={styles.page}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
          <MapboxGL.Camera zoomLevel={14} centerCoordinate={location} />
          <MapboxGL.PointAnnotation id="marker1" coordinate={location}>
            <View style={styles.markerContainer}>
              <View style={styles.marker} />
              <Text style={{ color: "black", fontSize: 12 }}>Me</Text>
            </View>
          </MapboxGL.PointAnnotation>
          
          {geoPolygon.length > 0 && (
            <MapboxGL.PointAnnotation
              id="userMarker"
              coordinate={geoPolygon[geoPolygon.length - 1]}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker} />
                <Text style={{ color: "black", fontSize: 12 }}>Me</Text>
              </View>
            </MapboxGL.PointAnnotation>
          )}
          
          {physicalPolygon && (
            <MapboxGL.ShapeSource id="polygonSource" shape={physicalPolygon}>
              <MapboxGL.FillLayer id="polygonFill" style={{ fillColor: "rgba(0,150,255,0.3)" }} />
              <MapboxGL.LineLayer id="polygonLine" style={{ lineColor: "rgba(0,150,255,0.8)", lineWidth: 2 }} />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
        
        <View style={{ position: 'absolute', bottom: 80, width: '100%', alignItems: 'center', zIndex: 1 }}>
          <AnimatedButton onPress={() => setIsModalVisible(true)} width={250}>
            Set Boundaries
          </AnimatedButton>
        </View>
        
        <CentralModal
          isVisible={isModalVisible}
          headerText="How would you like to?"
          onClose={() => setIsModalVisible(false)}
          animationType="slide"
        >
          <AnimatedButton onPress={handleSetVirtualGeofencing} width={250}>
            Virtually
          </AnimatedButton>
          <ThemedText weight="regular" style={{ color: theme.primary, textAlign: 'center' }}>OR</ThemedText>
          <AnimatedButton onPress={handleSetPhysicalGeofencing} width={250}>
            Physically
          </AnimatedButton>
        </CentralModal>
        
        <CentralModal
          isVisible={isPhysicalStartModalVisible}
          headerText="Ready to Track?"
          onClose={() => setIsPhysicalStartModalVisible(false)}
          animationType="slide"
        >
          <ThemedText weight="regular" style={{ color: theme.primary, textAlign: 'center' }}>
            To start tracking stand at a start point and walk around the boundaries.
          </ThemedText>
          <AnimatedButton onPress={handlePhysicalTracking} width={250}>
            Start
          </AnimatedButton>
        </CentralModal>

        {showPauseStopButtons && (
          <View style={styles.trackingControls}>
            {isPaused ? (
              <AnimatedButton
                onPress={resumeTracking}
                width={120}
                buttonStyles={{ marginRight: 10 }}
              >
                Resume
              </AnimatedButton>
            ) : (
              <AnimatedButton
                onPress={pauseTracking}
                width={120}
                buttonStyles={{ marginRight: 10 }}
              >
                Pause
              </AnimatedButton>
            )}

            <AnimatedButton
              onPress={finishTracking}
              width={120}
            >
              Finish
            </AnimatedButton>
          </View>
        )}
      </View>
    </>
  );
};

export default MapPage;