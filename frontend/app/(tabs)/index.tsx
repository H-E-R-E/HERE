import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import ThemedText from '../../components/ThemedText';
import BlurryEllipse from "../../components/BlurryEllipse";
import ProfileDisplay from "../../components/ProfileDisplay";
import EventSummaryCard from "../../components/EventSummaryCard";
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../hooks/useThemeColors";
import { useRouter } from "expo-router";
import SvgPicEventPage from "../../components/SvgPicEventPage";
import { StatusBar } from "expo-status-bar";
import { ensureScope } from "../../utils/ensureScope";
import { useSwitchScope } from "../services/switch-scope.service";
import { useGetMyEvents } from "../services/list-host-event.service";

export default function Home() {
  const theme = useThemeColors();
  const router = useRouter();
  const { mutateAsync: switchScope } = useSwitchScope();
  const [scopeReady, setScopeReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureScope("host", switchScope);
      } catch (err) {
        console.error("[Home] Failed to ensure host scope:", err);
      } finally {
        if (mounted) setScopeReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { data, isLoading } = useGetMyEvents({ limit: 2, enabled: scopeReady });

  const events = data?.events ?? [];
  const hasEvents = events.length > 0;
  const showLoading = !scopeReady || isLoading;

  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <View style={{ flex: 1, backgroundColor: theme.background, flexDirection: 'column' }}>
        {/* Top Section */}
        <View style={{ height: 100 }}>
          <BlurryEllipse />
          <ProfileDisplay />
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{ position: 'absolute', top: 50, right: 20 }}
          >
            <Ionicons name="settings-outline" size={35} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        {showLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 100 }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : hasEvents ? (
          <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 10 }}>
            {events.map((event) => (
              <EventSummaryCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/eventsummary?id=${event.id}&type=physical`)}
              />
            ))}
            <TouchableOpacity
              onPress={() => router.push("/myevents")}
              style={{ alignSelf: 'center', marginTop: 4 }}
            >
              <ThemedText weight="semibold" style={{ color: theme.primary, fontSize: 13 }}>
                See more
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 100 }}>
            <SvgPicEventPage />
            <ThemedText weight="semibold" style={{ color: theme.primary, fontSize: 13 }}>
              Create an event to save him!!
            </ThemedText>
          </View>
        )}
      </View>
    </>
  );
}