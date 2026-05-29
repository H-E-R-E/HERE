import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Dimensions, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeColors from '../hooks/useThemeColors';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'other';
  avatar?: string;
  username?: string;
}

interface MessageProps {
  text: string;
  sender: 'self' | 'other';
  username?: string;
}

const MessageBubble: React.FC<MessageProps> = ({ text, sender, username }) => {
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
    usernameText: {
      color: theme.text,
      fontSize: 10,
      marginBottom: 2,
      opacity: 0.7,
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
            {!isSelf && username && <Text style={styles.usernameText}>{username}</Text>}
            <Text style={styles.text}>{text}</Text>
        </View>
    </View>
  );
};

const ChatScreen = () => {
  const theme = useThemeColors();
  const { event_id } = useLocalSearchParams<{ event_id?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  
  // Use a fallback event ID of 1 if none provided for testing
  const activeEventId = event_id || '1';

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupChat = async () => {
      // 1. Fetch History
      try {
        const res = await api.get(`/chat/${activeEventId}`);
        if (res.data && Array.isArray(res.data)) {
          const history = res.data.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.content,
            sender: msg.user_id === user?.id ? 'self' : 'other',
            username: msg.username,
          }));
          // We reverse because FlatList is inverted
          setMessages(history.reverse());
        }
      } catch (err) {
        console.log("Failed to fetch chat history", err);
      }

      // 2. Setup WebSocket
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Construct WS URL from API base
        const baseUrl = api.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api/v1';
        ws.current = new WebSocket(`${baseUrl}/chat/ws/${activeEventId}`);
        
        ws.current.onopen = () => {
          // Send auth token as first message
          ws.current?.send(JSON.stringify({ token }));
        };

        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.id && data.content) {
              setMessages(prev => {
                // Ignore if we already have this message ID
                if (prev.find(m => m.id === data.id.toString())) return prev;
                
                const newMsg: Message = {
                  id: data.id.toString(),
                  text: data.content,
                  sender: data.user_id === user?.id ? 'self' : 'other',
                  username: data.username,
                };
                return [newMsg, ...prev];
              });
            }
          } catch (err) {
             console.log("WS parse error", err);
          }
        };

        ws.current.onerror = (e) => {
          console.log("WebSocket error", e);
        };
      }
      
      // Fallback polling just in case WS fails or silently drops
      interval = setInterval(async () => {
         try {
           const res = await api.get(`/chat/${activeEventId}`);
           if (res.data && Array.isArray(res.data)) {
              const history = res.data.map((msg: any) => ({
                id: msg.id.toString(),
                text: msg.content,
                sender: msg.user_id === user?.id ? 'self' : 'other',
                username: msg.username,
              }));
              setMessages(history.reverse());
           }
         } catch(e) {}
      }, 5000);
    };

    setupChat();

    return () => {
      ws.current?.close();
      if (interval) clearInterval(interval);
    };
  }, [activeEventId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // We send via HTTP so we get the exact DB row back immediately,
    // and let the server broadcast it to everyone else
    try {
      const res = await api.post(`/chat/${activeEventId}`, { content: inputText.trim() });
      const data = res.data;
      if (data) {
        const newMsg: Message = {
          id: data.id.toString(),
          text: data.content,
          sender: 'self',
          username: user?.username,
        };
        // Optimistic update
        setMessages(prev => {
           if (prev.find(m => m.id === newMsg.id)) return prev;
           return [newMsg, ...prev];
        });
      }
      setInputText("");
    } catch (err) {
      console.log("Failed to send message", err);
    }
  };

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
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    textInput: {
        flex: 1,
        backgroundColor: theme.border,
        color: theme.text,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: theme.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        data={messages}
        renderItem={({ item }) => <MessageBubble text={item.text} sender={item.sender} username={item.username} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput 
           style={styles.textInput}
           placeholder="Type a message..."
           placeholderTextColor="#888"
           value={inputText}
           onChangeText={setInputText}
           onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
           <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};



export default ChatScreen