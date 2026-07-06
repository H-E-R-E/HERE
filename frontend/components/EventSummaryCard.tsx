import React, { useMemo } from "react";
import { View, Image, Pressable, StyleSheet } from "react-native";
import ThemedText from "./ThemedText";
import useThemeColors from "../app/hooks/useThemeColors";
import { HostEvent } from "../app/services/list-host-event.service"

interface EventSummaryCardProps {
  event: HostEvent;
  onPress?: () => void;
}

const BAR_WIDTH = 160;
const BAR_HEIGHT = 10;

const EventSummaryCard: React.FC<EventSummaryCardProps> = ({ event, onPress }) => {
  const theme = useThemeColors();

  const rsvp = event.rsvp_count ?? 0;
  const checkedIn = event.checked_in_count ?? 0;
  const checkedInRatio = rsvp > 0 ? Math.min(checkedIn / rsvp, 1) : 0;
  const checkedInWidth = BAR_WIDTH * checkedInRatio;

  const styles = useMemo(() => 
  StyleSheet.create({
  card: {
    width: 350,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: theme.surface,
  },
  title: {
    fontSize: 14,
    flex: 1,
  },
  chartSection: {
    gap: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barLabel: {
    fontSize: 10,
    width: 70,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: theme.surface,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  barFill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
  barValue: {
    fontSize: 11,
    width: 24,
    textAlign: "right",
  },
}), [theme])

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.background, borderColor: theme.primary + "22" },
      ]}
    >
      <View style={styles.headerRow}>
        <Image
          source={require("../assets/event-placeholder.jpeg")}
          style={styles.thumbnail}
        />
        <ThemedText
          weight="semibold"
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
        >
          {event.name}
        </ThemedText>
      </View>

      <View style={styles.chartSection}>
        <View style={styles.barRow}>
          <ThemedText style={[styles.barLabel, { color: theme.text }]}>RSVP</ThemedText>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { width: BAR_WIDTH, backgroundColor: theme.primary }]}
            />
          </View>
          <ThemedText style={[styles.barValue, { color: theme.primary }]}>{rsvp}</ThemedText>
        </View>

        <View style={styles.barRow}>
          <ThemedText style={[styles.barLabel, { color: theme.text }]}>Checked in</ThemedText>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: checkedInWidth, backgroundColor: theme.primary, opacity: 0.55 },
              ]}
            />
          </View>
          <ThemedText style={[styles.barValue, { color: theme.primary }]}>{checkedIn}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
};



export default EventSummaryCard;