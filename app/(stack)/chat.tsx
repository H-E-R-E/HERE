import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeColors from '../hooks/useThemeColors'; 

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'other';
  avatar?: string;
}

const MESSAGES: Message[] = [
  { id: '1', text: 'GM GM Folks', sender: 'other', avatar: 'path/to/avatar.png' },
  { id: '2', text: 'Welcome to WEB CON 2025...', sender: 'other' },
];

interface MessageProps {
  text: string;
  sender: 'self' | 'other';
}

const MessageBubble: React.FC<MessageProps> = ({ text, sender }) => {
  const theme = useThemeColors();
  const isSelf = sender === 'self';

  const styles = useMemo(() => StyleSheet.create({
    bubble: {
      maxWidth: width * 0.7,
      padding: 10,
      borderRadius: 15,
      marginBottom: 10,
      backgroundColor: isSelf ? theme.primary : theme.chatBubble,
      alignSelf: isSelf ? 'flex-end' : 'flex-start',
    },
    text: {
      color: theme.text,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#ccc",
        marginRight: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: isSelf ? 'flex-end' : 'flex-start',
    }
  }), [theme, isSelf]);

  return (
    <View style={styles.row}>
        {sender === 'other' && <View style={styles.avatar} />}
        <View style={styles.bubble}>
            <Text style={styles.text}>{text}</Text>
        </View>
    </View>
  );
};

const ChatScreen = () => {
 const theme = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profilePic: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#ccc",
      marginRight: 10,
    },
    headerTextContainer: {
      justifyContent: 'center',
    },
    mainHeaderText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    subHeaderText: {
      fontSize: 12,
      color: theme.text,
    },
    messagesList: {
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    inputContainer: {
        backgroundColor: theme.background,
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    disabledText: {
        color: theme.text,
    }
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.profilePic} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.mainHeaderText}>Web Con</Text>
            <Text style={styles.subHeaderText}>200 Members</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={MESSAGES}
        renderItem={({ item }) => <MessageBubble text={item.text} sender={item.sender} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      <View style={styles.inputContainer}>
        <Text style={styles.disabledText}>Only host can send messages</Text>
      </View>
    </SafeAreaView>
  );
};



export default ChatScreen