import { FlatList, View, TouchableOpacity, Pressable } from "react-native";
import ThemedText from '../../components/ThemedText';
import { useEvent } from "../../context/EventContext";
import { useRouter } from "expo-router";
import InputField from "../../components/InputField";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import useTheme from "../hooks/useThemeColors"

export default function Events() {
  const { events } = useEvent();
  const router = useRouter();
  const [eventSearch, setEventSearch] = useState("");
  const theme = useTheme();

  useEffect(() => {
    console.log(events);
  }, [events])
  return (
    <>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 40}}>
             <Pressable onPress={() => router.push("/home")}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </Pressable>
            <InputField value={eventSearch} onChangeText={setEventSearch} placeholder="Search Event" inputStyle={{ borderColor: "#F4EBFE"}} />    
        </View> 
        <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/eventdetails", params: { id: item.id } })}
        >
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <ThemedText weight="semibold">{item.title}</ThemedText>
            <ThemedText weight="regular">{item.date} @ {item.time}</ThemedText>
          </View>
        </TouchableOpacity>
      )}
    />
  </>

  );
}
