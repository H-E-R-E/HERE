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
import { useEvent } from "../../context/EventContext";

MapboxGL.setAccessToken("pk.eyJ1IjoidHJlYS1zdXJlIiwiYSI6ImNtZzh1Zm1iZDA0bHoya3F0eTR2NGM2azYifQ.biSfMvMbfZ0-amWFhrReOA");


const MapPage = () => {
  const [location, setLocation] = useState<[number, number]>([0, 0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isdrawableMapView, setIsDrawableMapView] = useState(false);
  const [geoPolygon, setGeoPolygon] = useState<number[][]>([]);
  const [showPauseStopButtons, setshowPauseStopButtons] = useState(false);
  const [isPhysicalStartModalVisible, setIsPhysicalStartModalVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false)
  const [isSetBoundariesButtonVisible, setIsSetBoundariesButtonVisible] = useState(true);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const theme = useThemeColors();
  const router = useRouter();
  const { isPhysical, updatePhysicalEvent } = useEvent();

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
    console.log(isPhysical)
  }, [isPhysical])
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

  useEffect(() => {
  return () => {
    if (watchRef.current) {
      watchRef.current.remove();
    }
  };
  }, []);

    const handleBackPress = () => {
    if (geoPolygon.length > 2) {
      updatePhysicalEvent({ isTrackingAttendance: true });
    }
    if (isPhysical) {
      updatePhysicalEvent({ geoPolygon: geoPolygon });
      router.push("/physical-events");
    } 
  };

  
  function handleSetVirtualGeofencing() {
    console.log('🎯 MapPage: Virtual geofencing mode selected');
    setIsModalVisible(false);
    setIsDrawableMapView(true);
    setGeoPolygon([]);
  }

  function handleSetPhysicalGeofencing() {
    console.log('🚶 MapPage: Physical geofencing mode selected');
    setIsModalVisible(false);
    setIsPhysicalStartModalVisible(true);
    setGeoPolygon([]);
  }

  function handleVirtualTrackingFinish() {
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

    }

  async function handlePhysicalTracking() {
    try {
      console.log('▶️ MapPage: Starting physical tracking...');
      setIsPhysicalStartModalVisible(false);
      setIsSetBoundariesButtonVisible(false);
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
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 0.5,
          timeInterval: 1000,
        },
        (loc) => {
          console.log('📍 MapPage: New position tracked:', {
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
            accuracy: loc.coords.accuracy
          });
          setGeoPolygon((prev) => {
            const newPoint: [number, number] = [loc.coords.longitude, loc.coords.latitude];
            const lastPoint = prev[prev.length - 1];
            if (!lastPoint) return [newPoint];

            const distance = getDistanceInMeters(lastPoint, newPoint);
            if (distance > 0.3 && distance < 10) {
              return [...prev, newPoint];
            }
            return prev;
          });
        }
      );
      
      console.log('✅ MapPage: Physical tracking started successfully');
    } catch (error) {
      console.error('❌ MapPage: Error starting physical tracking:', error);
    }
  }
      //This uses Haversine's formula btw
    function getDistanceInMeters(
        pointsA: number[],
        pointsB: number[]
      ): number {
        const R = 6371000; // Earth's radius in meters
        const toRad = (deg: number) => (deg * Math.PI) / 180;

        const dLat = toRad(pointsB[1] - pointsA[1]);
        const dLon = toRad(pointsB[0] - pointsA[0]);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(pointsA[1])) *
            Math.cos(toRad(pointsB[1])) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
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
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 0.5,
          timeInterval: 1000,
          },
          (loc) => {
            console.log('📍 MapPage: Position tracked (resumed):', {
              longitude: loc.coords.longitude,
              latitude: loc.coords.latitude
            });
            setGeoPolygon((prev) => {
            const newPoint: [number, number] = [loc.coords.longitude, loc.coords.latitude];
            const lastPoint = prev[prev.length - 1];
            if (!lastPoint) return [newPoint];

            const distance = getDistanceInMeters(lastPoint, newPoint);
            if (distance > 0.3 && distance < 10) {
              return [...prev, newPoint];
            }
            return prev;
          });
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

    console.log('📍 MapPage: Polygon coordinates:', closedPolygon);
    

    setshowPauseStopButtons(false);
    setIsSetBoundariesButtonVisible(true);

  };

  const handleMapPress = (event: any) => {
    if (!isdrawableMapView) return;
    
    const [longitude, latitude] = event.geometry.coordinates as [number, number];
    console.log('👆 MapPage: Point added to virtual polygon:', { longitude, latitude });
    console.log('📊 MapPage: Total points:', geoPolygon.length + 1);
    
    
    setGeoPolygon((prev) => ([...prev, [longitude, latitude]]));
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

    const polygonFeature: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[...geoPolygon, geoPolygon[0]]],
      },
    };
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
      <TouchableOpacity onPress={handleVirtualTrackingFinish} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          onPress={handleMapPress}
        >
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
              <View style={[styles.marker, { backgroundColor: theme.primary }]} />
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
                style={{ lineColor: theme.primary, lineWidth: 2 }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>

        <View style={styles.drawControls}>
          <AnimatedButton
            onPress={() => {
              console.log('🗑️ MapPage: Clearing virtual polygon');
              setGeoPolygon([]);
            }}
            width={120}
            buttonStyles={{ marginRight: 10 }}
          >
            Clear
          </AnimatedButton>
          <AnimatedButton
            onPress={handleVirtualTrackingFinish}
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
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
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
          {geoPolygon.length > 2? (
          <>
            {geoPolygon.map((point, index) => 
            <MapboxGL.PointAnnotation
              key={`point-${index}`}
              id={`point-${index}`}
              coordinate={point as [number, number]}
            >
              <View style={[styles.marker, { backgroundColor: "blue" }]} />
            </MapboxGL.PointAnnotation>
          )}

            <MapboxGL.ShapeSource id="polygonSource" shape={polygonFeature}>
              <MapboxGL.FillLayer
                id="polygonFill"
                style={{ fillColor: "rgba(0, 150, 255, 0.3)" }}
              />
              <MapboxGL.LineLayer
                id="polygonLine"
                style={{ lineColor: "rgba(0, 150, 255, 0.8)", lineWidth: 2 }}
              />
            </MapboxGL.ShapeSource>
          
        </>
          )
          : 
            null
        }
           
          
        </MapboxGL.MapView>
        
        {isSetBoundariesButtonVisible? (
          <View style={{ position: 'absolute', bottom: 80, width: '100%', alignItems: 'center', zIndex: 1 }}>
          <AnimatedButton onPress={() => setIsModalVisible(true)} width={250}>
            Set Boundaries
          </AnimatedButton>
        </View>
        ) : (null)}
        
        
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