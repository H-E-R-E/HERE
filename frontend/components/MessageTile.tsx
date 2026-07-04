import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useThemeColors from '../app/hooks/useThemeColors';

interface MessageTileProps {
  username: string;
  content: string;
}

const MessageTile = ({ username, content }: MessageTileProps) => {
  const theme = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'column',
      paddingVertical: 6,
      marginBottom: 12,
    },
    username: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primary, 
      marginBottom: 4,
    },
    messageText: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.messageText}>{content}</Text>
    </View>
  );
};

export default MessageTile;