import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  PanResponder,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEvent } from "../../context/EventContext";
import ThemedText from "../../components/ThemedText";
import useThemeColors from "../hooks/useThemeColors";

MapboxGL.setAccessToken(
  "pk.eyJ1IjoidHJlYS1zdXJlIiwiYSI6ImNtcTU2aXZiazAxamsycnM4cDYwZzZ6b24ifQ.ecLLmelSB1rjTiAkqUAv4g"
);

const PRIMARY = "#7851A9";
const PRIMARY_LIGHT = "rgba(120, 81, 169, 0.18)";
const PRIMARY_BORDER = "rgba(120, 81, 169, 0.55)";
const WHITE = "#fff";
const SLIDER_MIN = 10;    // metres — matches backend ge=10
const SLIDER_MAX = 1000;  // metres — reasonable cap for an event

function buildCircleFeature(
  center: [number, number],
  radiusMetres: number,
  steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6371000;
  const lat = (center[1] * Math.PI) / 180;
  const lon = (center[0] * Math.PI) / 180;
  const d = radiusMetres / earthRadius;

  for (let i = 0; i <= steps; i++) {
    const bearing = (i * 2 * Math.PI) / steps;
    const pLat = Math.asin(
      Math.sin(lat) * Math.cos(d) +
        Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
    );
    const pLon =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(pLat)
      );
    coords.push([(pLon * 180) / Math.PI, (pLat * 180) / Math.PI]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

function formatRadius(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}


interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  trackWidth: number;
}

const RadiusSlider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  onChange,
  trackWidth,
}) => {
  const THUMB = 28;
  const usableWidth = trackWidth - THUMB;
  const ratio = (value - min) / (max - min);
  const xRef = useRef(ratio * usableWidth);
  const pan = useRef(new Animated.Value(xRef.current)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.stopAnimation((v) => {
          xRef.current = v;
        });
      },
      onPanResponderMove: (_, gs) => {
        const next = Math.max(0, Math.min(usableWidth, xRef.current + gs.dx));
        pan.setValue(next);
        const newVal = Math.round(min + (next / usableWidth) * (max - min));
        onChange(newVal);
      },
      onPanResponderRelease: (_, gs) => {
        xRef.current = Math.max(0, Math.min(usableWidth, xRef.current + gs.dx));
      },
    })
  ).current;

  // Sync when value changes externally (edit mode pre-population)
  useEffect(() => {
    const target = ((value - min) / (max - min)) * usableWidth;
    pan.setValue(target);
    xRef.current = target;
  }, []);

  const fillWidth = pan.interpolate({
    inputRange: [0, usableWidth],
    outputRange: [0, usableWidth],
    extrapolate: "clamp",
  });

  return (
    <View style={{ width: trackWidth, height: 40, justifyContent: "center" }}>
      {/* Track */}
      <View
        style={{
          height: 5,
          borderRadius: 3,
          backgroundColor: "rgba(120,81,169,0.2)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: fillWidth,
            backgroundColor: PRIMARY,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Thumb */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: "absolute",
          left: pan,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: PRIMARY,
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
          elevation: 6,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: WHITE,
            opacity: 0.9,
          }}
        />
      </Animated.View>
    </View>
  );
};

const SLIDER_TRACK_WIDTH = 280;

const MapPage: React.FC = () => {
  const router = useRouter();
  const { physicalEvent, updatePhysicalEvent } = useEvent();
  const theme = useThemeColors();

  const center: [number, number] = [
    physicalEvent.longitude,
    physicalEvent.latitude,
  ];

  // Edit mode: pre-populate with existing radius if already set
  const existingRadius =
    physicalEvent.geofence_radius &&
    physicalEvent.geofence_radius >= SLIDER_MIN
      ? physicalEvent.geofence_radius
      : 100;

  const [radius, setRadius] = useState(existingRadius);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isEditMode =
    !!physicalEvent.geofence_radius &&
    physicalEvent.geofence_radius >= SLIDER_MIN;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied.");
      }
      setLoading(false);
    })();
  }, []);

  const circleFeature = useMemo(
    () => buildCircleFeature(center, radius),
    [radius]
  );

  const handleConfirm = () => {
    updatePhysicalEvent({ geofence_radius: radius });
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: { flex: 1, backgroundColor: "#0e0b14" },
        map: { flex: 1 },
        loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0e0b14" },
        errorText: { color: WHITE, fontSize: 15, marginTop: 12 },

        // Back button
        backBtn: {
          position: "absolute",
          top: 52,
          left: 20,
          zIndex: 10,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(14,11,20,0.75)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: PRIMARY_BORDER,
        },

        editBadge: {
          position: "absolute",
          top: 52,
          right: 20,
          zIndex: 10,
          backgroundColor: PRIMARY,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 5,
        },
        editBadgeText: {
          color: WHITE,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.5,
        },

        panel: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 28,
          paddingTop: 20,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: PRIMARY_BORDER,
        },
        pill: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.15)",
          alignSelf: "center",
          marginBottom: 20,
        },
        panelTitle: {
          color: WHITE,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          opacity: 0.5,
          marginBottom: 4,
        },
        radiusDisplay: {
          color: PRIMARY,
          fontSize: 38,
          fontWeight: "800",
          letterSpacing: -1,
          marginBottom: 18,
        },
        sliderRow: {
          alignItems: "center",
          marginBottom: 6,
        },
        sliderLabels: {
          flexDirection: "row",
          justifyContent: "space-between",
          width: SLIDER_TRACK_WIDTH,
          marginBottom: 22,
        },
        sliderLabel: {
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
        },

        confirmBtn: {
          backgroundColor: PRIMARY,
          borderRadius: 16,
          height: 54,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 8,
        },
        confirmText: {
          color: WHITE,
          fontSize: 16,
          fontWeight: "700",
          letterSpacing: 0.3,
        },

        pinOuter: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: PRIMARY,
          borderWidth: 3,
          borderColor: WHITE,
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.6,
          shadowRadius: 6,
          elevation: 6,
        },
      }),
    []
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" translucent />
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" translucent />
        <Ionicons name="location-outline" size={40} color={PRIMARY} />
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" translucent />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={20} color={WHITE} />
      </TouchableOpacity>

      {/* Edit mode badge */}
      {isEditMode && (
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>EDITING</Text>
        </View>
      )}

      {/* Map */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Light}
      >
        <MapboxGL.Camera
          zoomLevel={15}
          centerCoordinate={center}
          animationMode="flyTo"
          animationDuration={800}
        />

        {/* Radius circle */}
        <MapboxGL.ShapeSource id="radiusSource" shape={circleFeature}>
          <MapboxGL.FillLayer
            id="radiusFill"
            style={{ fillColor: PRIMARY_LIGHT }}
          />
          <MapboxGL.LineLayer
            id="radiusLine"
            style={{
              lineColor: PRIMARY,
              lineWidth: 2,
              lineDasharray: [4, 2],
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Centre pin */}
        <MapboxGL.PointAnnotation id="centerPin" coordinate={center}>
          <View style={styles.pinOuter} />
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      {/* Bottom panel */}
      <View style={styles.panel}>
        <View style={styles.pill} />

        <Text style={styles.panelTitle}>Geofence Radius</Text>
        <Text style={styles.radiusDisplay}>{formatRadius(radius)}</Text>

        <View style={styles.sliderRow}>
          <RadiusSlider
            value={radius}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={setRadius}
            trackWidth={SLIDER_TRACK_WIDTH}
          />
        </View>

        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{SLIDER_MIN} m</Text>
          <Text style={styles.sliderLabel}>{SLIDER_MAX} m</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>
            {isEditMode ? "Update Boundary" : "Confirm Boundary"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapPage;