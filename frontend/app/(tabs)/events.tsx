import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Pressable,
  FlatList,
  StyleSheet,
  Image,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useRouter } from "expo-router";
import ThemedText from "../../components/ThemedText";
import InputField from "../../components/InputField";
import SvgPicNoEvents from "../../components/SvgPicENoEvents";
import { useEvent } from "../../context/EventContext";
import useThemeColors from "../hooks/useThemeColors";
import users from "../../data/users.json";
import { AppEvent } from "../../types/EventTypes";
import { useAuth } from "../../context/AuthContext";
import CentralModal from "../../components/CentralModal";
import AnimatedButton from "../../components/AnimatedButton";


const Tab = createMaterialTopTabNavigator();

interface User {
  id: string;
  name: string;
}

const Events: React.FC = () => {
  const { events } = useEvent();
  const router = useRouter();
  const theme = useThemeColors();
  const [eventSearch, setEventSearch] = useState("");
  const [viewType, setViewType] = useState<'registered' | 'hosted'>('hosted');
const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const { user } = useAuth();

    useEffect(() => {
        console.log('All events:', events);
    console.log('Current user ID:', user?.id);
    }, [events])
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 40,
          paddingHorizontal: 16,
        },
        searchWrapper: {
          flex: 1,
          marginLeft: 10,
        },
        flatListContainer: { flexGrow: 1, alignItems: "center", marginVertical: 20 },
        eventList: {
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
        },
        image: { width: "100%", height: "100%", resizeMode: "cover" },
        eventDetails: { flex: 1, padding: 10, justifyContent: "space-between" },
        titleRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        title: { fontSize: 18 },
        time: { fontSize: 14, color: theme.text },
        infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
        infoText: { fontSize: 10, color: theme.text },
        noEventsWrapper: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
      }),
    []
  );

  function capitalizeFirstLetter(str: string) {
  if (str.length === 0) {
    return ""; 
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const getFilteredEvents = (events: AppEvent[], isPast: boolean) => {
  const now = new Date();

  let filtered = events.filter(e => {
    const eventDate = getEventDateTime(e);
    const matchTime = isPast ? eventDate < now : eventDate >= now;

    if (viewType === 'hosted') {
      return matchTime && (e.creator === user?.id || e.cohosts.includes(user?.id || ""));
    } else {
      // registered/attended events
      return matchTime && (e.creator !== user?.id && e.cohosts.includes(user?.id || ""));
    }
  });

  if (eventSearch.trim()) {
    const searchLower = eventSearch.toLowerCase();
    filtered = filtered.filter(e => e.title.toLowerCase().includes(searchLower));
  }

  return filtered;
};

  const getEventDateTime = (event: AppEvent) => {
  // Combine date + time into a full Date object
  // Assume time is in "HH:mm" 24-hour format
  const [hours, minutes] = event.time?.split(":").map(Number) ?? [0, 0];
  const eventDate = new Date(event.date);
  eventDate.setHours(hours);
  eventDate.setMinutes(minutes);
  return eventDate;
};

  const renderEventItem = (item: AppEvent) => {
    // Lookup cohost names
    const cohostNames = item.cohosts
      .map(id => users.find((u: User) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    return (
      <Pressable onPress={() => router.push(`/eventdetails?id=${item.id}`)}>
        <View style={styles.eventList}>
          <View style={styles.imageContainer}>
          <Image
        source={item.imageUrl ? { uri: item.imageUrl } : undefined}
        style={styles.image}
      />

          </View>
          <View style={styles.eventDetails}>
            <View style={styles.titleRow}>
              <ThemedText weight="semibold" style={styles.title}>
                {item.title}
              </ThemedText>
              <ThemedText weight="regular" style={styles.time}>
                {item.time}
              </ThemedText>
            </View>
            
            <View style={styles.infoRow}>
             <View>
                 <ThemedText style={{ fontSize: 7 }}>Host</ThemedText>
              
              <ThemedText weight="semibold" style={styles.infoText}>{item.creator}</ThemedText>
              {cohostNames ? <ThemedText weight="semibold" style={styles.infoText}>, {cohostNames}</ThemedText> : null}
             </View>
           
                
                
                  </View>
                  <View style={{ position: "absolute", right: 20, top: 80}}>
                <ThemedText weight="semibold"  style={styles.infoText}><Ionicons name="calendar-clear-outline" size={10} color={theme.primary} /> {item.date} <Ionicons name="home-outline" size={10} color={theme.primary} />{capitalizeFirstLetter(item.eventType)}</ThemedText>
                </View>
                
                
              
          
          </View>
        </View>
      </Pressable>
    );
  };

  const PastScreen = () => {
  const pastEvents = getFilteredEvents(events, true);
  return pastEvents.length ? (
    <FlatList
      data={pastEvents}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.flatListContainer}
      renderItem={({ item }) => renderEventItem(item)}
    />
  ) : (
    <View style={styles.noEventsWrapper}>
      <SvgPicNoEvents />
      <ThemedText weight="semibold" style={{ color: theme.primary }}>
        No Past Events
      </ThemedText>
    </View>
  );
};

const FutureScreen = () => {
  const futureEvents = getFilteredEvents(events, false);
  return futureEvents.length ? (
    <FlatList
      data={futureEvents}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.flatListContainer}
      renderItem={({ item }) => renderEventItem(item)}
    />
  ) : (
    <View style={styles.noEventsWrapper}>
      <SvgPicNoEvents />
      <ThemedText weight="semibold" style={{ color: theme.primary }}>
        No Future Events
      </ThemedText>
    </View>
  );
};

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => router.push("/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </Pressable>
        <View style={styles.searchWrapper}>
          <InputField
            value={eventSearch}
            onChangeText={setEventSearch}
            placeholder="Search Event"
            inputStyle={{ borderColor: "#F4EBFE" }}
            showSwitchButton
            onSwitchPress={() => setSwitchModalVisible(true)}
          />

        </View>
      </View>

      {/* Top Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: theme.primary },
          tabBarStyle: { backgroundColor: theme.background },
        }}
      >
        <Tab.Screen name="Past" component={PastScreen} />
        <Tab.Screen name="Future" component={FutureScreen} />
      </Tab.Navigator>


<CentralModal
  isVisible={switchModalVisible}
  onClose={() => setSwitchModalVisible(false)}
  animationType="slide"
  headerText="Switch To"
  headerButtonIcon="close" 
   onHeaderButtonPress={() => setSwitchModalVisible(false)}
  >
     

      <AnimatedButton
      width={180}
       onPress={() => {
          setViewType(viewType === 'registered' ? 'hosted' : 'registered');
          setSwitchModalVisible(false);
        }}
        >
          <ThemedText weight="semibold" style={{ color: '#fff' }}>
           {viewType === 'registered' ? 'Hosted Events' : 'Registered Events'}
        </ThemedText>
       
      </AnimatedButton>
      
    
</CentralModal>

    </View>
  );
};

export default Events;
