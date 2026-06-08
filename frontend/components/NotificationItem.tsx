import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from "../app/hooks/useThemeColors"

export interface NotificationItemProps {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: 'alert' | 'event' | 'message' | 'system';
  onPress?: () => void;
}

const NotificationItem = ({
  id,
  title,
  message,
  is_read,
  created_at,
  type = 'system',
  onPress,
}: NotificationItemProps) => {
  const theme = useThemeColors();

  // Dynamic icon configuration based on the notification type
  const iconConfig = useMemo(() => {
    switch (type) {
      case 'alert':
        return { name: 'warning-outline' as const, color: '#ef4444' };
      case 'event':
        return { name: 'calendar-outline' as const, color: theme.primary };
      case 'message':
        return { name: 'chatbubble-outline' as const, color: '#3b82f6' };
      default:
        return { name: 'notifications-outline' as const, color: theme.text };
    }
  }, [type, theme]);

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          // Matches the other dev's logic for unread vs read backgrounds
          backgroundColor: is_read ? theme.background : theme.chatBubble,
          borderColor: theme.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardLayout}>
        {/* Left Icon Area */}
        <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
          <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
        </View>

        {/* Right Content Area */}
        <View style={styles.contentContainer}>
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontWeight: is_read ? 'normal' : 'bold' }
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!is_read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
          </View>

          <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
            {message}
          </Text>

          <Text style={[styles.time, { color: theme.text }]}>
            {new Date(created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2, // Subtle push down to align with the first line of text
  },
  contentContainer: {
    flex: 1,
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

export default NotificationItem;