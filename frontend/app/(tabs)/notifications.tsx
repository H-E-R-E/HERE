import React, { useEffect, useState, useMemo } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, SafeAreaView } from "react-native";
import ThemedText from "../../components/ThemedText";
import useThemeColors from '../hooks/useThemeColors';
import { api } from '../services/api';
import NotificationItem from "../../components/NotificationItem";
import { AppNotification } from "../services/notifications.service";
import SvgNoNotifications from "../../components/SvgNoNotification";


export default function Notifications() {
  const theme = useThemeColors();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    markAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    listContent: {
      padding: 15,
      flexGrow: 1,
    },
    notificationCard: {
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    title: {
      fontSize: 16,
      flex: 1,
      marginRight: 10,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    message: {
      fontSize: 14,
      opacity: 0.8,
      marginBottom: 8,
    },
    time: {
      fontSize: 12,
      opacity: 0.5,
    },

      center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 10,
      },
  }), [theme]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.log('Failed to fetch notifications', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.log('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read_all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.log('Failed to mark all as read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }: { item: AppNotification}) => (
      <NotificationItem
        id={item.id}
        title={item.title}
        message={item.message}
        is_read={item.is_read}
        created_at={item.created_at}
        onPress={() => !item.is_read && markAsRead(item.id)}
      />
    );
    
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      
      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
        <View style={styles.center}>
          <SvgNoNotifications style={{ marginBottom: -30 }} />
          <ThemedText weight="semibold" style={{ color: theme.primary }}>
            No notifications, check back soon!
          </ThemedText>
        </View>
        }
      />
    </SafeAreaView>
  );
}

const styleSheet = StyleSheet.create({
  notificationCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
});