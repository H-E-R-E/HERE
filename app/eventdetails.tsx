import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEvent } from "../context/EventContext";

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const { events } = useEvent();

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{event.title}</Text>
      <Text>{event.date} @ {event.time}</Text>
      <Text>{event.description || "No description"}</Text>
      <Text>Location: {event.location || "Not set"}</Text>
      <Text>Fee: {event.eventFee || "Free"}</Text>
    </View>
  );
}
