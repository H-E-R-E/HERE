import React, { useMemo, useState } from "react";
import {
  View,
  Pressable,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useRouter } from "expo-router";
import ThemedText from "../../components/ThemedText";
import InputField from "../../components/InputField";
import SvgPicNoEvents from "../../components/SvgPicENoEvents";
import useThemeColors from "../hooks/useThemeColors";
import { EventResponse, useListEvents } from "../services/list-events.service";

type EventStatus = "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

const STATUS_META: Record<
  EventStatus,
  { label: string; color: string; bg: string }
> = {
  Scheduled: { label: "Scheduled", color: '#7851A9', bg: "#f3e8fd" },
  Ongoing:   { label: "Ongoing",   color: "#1A7F4B", bg: "#E6F5EE" },
  Completed: { label: "Completed", color: "#6B6B6B", bg: "#F0F0F0" },
  Cancelled: { label: "Cancelled", color: "#C0392B", bg: "#FDECEB" },
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

interface EventCardProps {
  item: EventResponse;
  onPress: () => void;
  primaryColor: string;
  textColor: string;
}

const EventCard: React.FC<EventCardProps> = ({
  item,
  onPress,
  primaryColor,
  textColor,
}) => {
  const { date, time } = formatDateTime(item.start_time);
  const statusMeta =
    STATUS_META[(item.status as EventStatus) ?? "Scheduled"] ??
    STATUS_META.Scheduled;

  return (
    <Pressable onPress={onPress} style={cardStyles.wrapper}>
      <View style={cardStyles.imageContainer}>
    <Image
        source={
          require("../../assets/event-placeholder.jpeg")
        }
        style={cardStyles.image}
      />
      </View>

      <View style={cardStyles.details}>
        {/* Title row */}
        <View style={cardStyles.titleRow}>
          <ThemedText
            weight="semibold"
            style={cardStyles.title}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>

          {/* Status badge */}
          <View
            style={[
              cardStyles.badge,
              { backgroundColor: statusMeta.bg },
            ]}
          >
            <ThemedText
              weight="semibold"
              style={[cardStyles.badgeText, { color: statusMeta.color }]}
            >
              {statusMeta.label}
            </ThemedText>
          </View>
        </View>

        {/* Host */}
        <ThemedText style={[cardStyles.meta, { color: textColor }]}>
          <ThemedText style={cardStyles.metaLabel}>Host: </ThemedText>
          {item.host_name}
        </ThemedText>

        {/* Date + time */}
        <View style={cardStyles.footerRow}>
          <Ionicons name="calendar-clear-outline" size={11} color={primaryColor} />
          <ThemedText style={[cardStyles.meta, { color: textColor, marginLeft: 3 }]}>
            {date}
          </ThemedText>
          <Ionicons
            name="time-outline"
            size={11}
            color={primaryColor}
            style={{ marginLeft: 8 }}
          />
          <ThemedText style={[cardStyles.meta, { color: textColor, marginLeft: 3 }]}>
            {time}
          </ThemedText>
        </View>

        {/* Category */}
        <ThemedText style={[cardStyles.category, { color: primaryColor }]}>
          {item.category}
        </ThemedText>
      </View>
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    height: 100,
    width: 350,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  imageContainer: {
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    width: 120,
    height: 100,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  details: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 4,
  },
  title: { fontSize: 14, flex: 1 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9 },
  meta: { fontSize: 10 },
  metaLabel: { fontSize: 10, color: "#999" },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: { fontSize: 9 },
});


interface EventListScreenProps {
  eventType: "physical" | "virtual";
  search: string;
}

const EventListScreen: React.FC<EventListScreenProps> = ({
  eventType,
  search,
}) => {
  const router = useRouter();
  const theme = useThemeColors();
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const { data, isLoading, isError } = useListEvents(eventType, {
    limit: LIMIT,
    offset,
    status: null,
  });

  const filtered = useMemo(() => {
    if (!data?.events) return [];
    if (!search.trim()) return data.events;
    const lower = search.toLowerCase();
    return data.events.filter((e) =>
      e.name.toLowerCase().includes(lower)
    );
  }, [data, search]);

  if (isLoading) {
    return (
      <View style={listStyles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={listStyles.center}>
        <ThemedText weight="semibold" style={{ color: "#C0392B" }}>
          Failed to load events
        </ThemedText>
      </View>
    );
  }

  if (!filtered.length) {
    return (
      <View style={listStyles.center}>
        <SvgPicNoEvents />
        <ThemedText weight="semibold" style={{ color: theme.primary }}>
          No {eventType === "physical" ? "Physical" : "Virtual"} Events
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={listStyles.container}
      renderItem={({ item }) => (
        <EventCard
          item={item}
          primaryColor={theme.primary}
          textColor={theme.text}
          onPress={() => router.push(`/eventdetails?id=${item.id}&type=${eventType}`)}
        />
      )}
      onEndReached={() => {
        if (data && offset + LIMIT < data.total) {
          setOffset((prev) => prev + LIMIT);
        }
      }}
      onEndReachedThreshold={0.4}
    />
  );
};

const listStyles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", marginVertical: 20 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
});

const Tab = createMaterialTopTabNavigator();

const Events: React.FC = () => {
  const router = useRouter();
  const theme = useThemeColors();
  const [search, setSearch] = useState("");


  const PhysicalScreen = useMemo(
    () => () => <EventListScreen eventType="physical" search={search} />,
    [search]
  );
  const VirtualScreen = useMemo(
    () => () => <EventListScreen eventType="virtual" search={search} />,
    [search]
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={rootStyles.header}>
        <Pressable onPress={() => router.push("/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </Pressable>
        <View style={rootStyles.searchWrapper}>
          <InputField
            value={search}
            onChangeText={setSearch}
            placeholder="Search Event"
            inputStyle={{ borderColor: "#F4EBFE" }}
          />
        </View>
      </View>

      {/* Tabs */}
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIndicatorStyle: { backgroundColor: theme.primary },
        tabBarStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#888',
        
        tabBarLabel: ({ focused, color }) => (
          <ThemedText
            weight={focused ? "semibold" : "regular"}
            style={{ color: color,  fontSize: 12 }}
          >
            {route.name}
          </ThemedText>
        ),
      })}
    >
      <Tab.Screen name="Physical" component={PhysicalScreen} />
      <Tab.Screen name="Virtual" component={VirtualScreen} />
    </Tab.Navigator>
    </View>
  );
};

const rootStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  searchWrapper: {
    flex: 1,
    marginLeft: 10,
  },
});

export default Events;