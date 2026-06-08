import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeColors from '../hooks/useThemeColors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'other';
  username?: string;
}

interface MessageBubbleProps {
  text: string;
  sender: 'self' | 'other';
  username?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, username }) => {
  const theme = useThemeColors();
  const isSelf = sender === 'self';

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: isSelf ? 'flex-end' : 'flex-start',
      marginVertical: 3,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.surface,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    avatarSpacer: {
      width: 36,
    },
    bubble: {
      maxWidth: width * 0.72,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: isSelf ? theme.primary : theme.surface,
      borderBottomRightRadius: isSelf ? 4 : 18,
      borderBottomLeftRadius: isSelf ? 18 : 4,
    },
    username: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.primary,
      marginBottom: 3,
    },
    text: {
      fontSize: 14,
      color: isSelf ? '#fff' : theme.text,
      lineHeight: 20,
    },
    time: {
      fontSize: 10,
      color: isSelf ? 'rgba(255,255,255,0.55)' : theme.textSecondary,
      marginTop: 4,
      textAlign: isSelf ? 'right' : 'left',
    },
  }), [theme, isSelf]);

  const initial = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.row}>
      {!isSelf ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      ) : (
        <View style={styles.avatarSpacer} />
      )}
      <View style={styles.bubble}>
        {!isSelf && username && (
          <Text style={styles.username}>{username}</Text>
        )}
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};


const ChatScreen = () => {
  const theme = useThemeColors();
  const { event_id } = useLocalSearchParams<{ event_id?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const activeEventId = event_id || '1';

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupChat = async () => {
      try {
        const res = await api.get(`/chat/${activeEventId}`);
        if (res.data && Array.isArray(res.data)) {
          const history = res.data.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.content,
            sender: msg.user_id === user?.id ? 'self' : 'other',
            username: msg.username,
          }));

        }
      } catch (err) {
        console.log('Failed to fetch chat history', err);
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const baseUrl = api.defaults.baseURL?.replace('http', 'ws') || 'ws://localhost:8000/api/v1';
        ws.current = new WebSocket(`${baseUrl}/chat/ws/${activeEventId}`);

        ws.current.onopen = () => {
          ws.current?.send(JSON.stringify({ token }));
        };

        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.id && data.content) {
              setMessages(prev => {
                if (prev.find(m => m.id === data.id.toString())) return prev;
                return [{
                  id: data.id.toString(),
                  text: data.content,
                  sender: data.user_id === user?.id ? 'self' : 'other',
                  username: data.username,
                }, ...prev];
              });
            }
          } catch (err) {
            console.log('WS parse error', err);
          }
        };

        ws.current.onerror = (e) => console.log('WebSocket error', e);
      }

      interval = setInterval(async () => {
        // try {
        //   const res = await api.get(`/chat/${activeEventId}`);
        //   if (res.data && Array.isArray(res.data)) {
        //     setMessages(res.data.map((msg: any) => ({
        //       id: msg.id.toString(),
        //       text: msg.content,
        //       sender: msg.user_id === user?.id ? 'self' : 'other',
        //       username: msg.username,
        //     })).reverse());
        //   }
        // } catch (e) {}
      }, 5000);
    };

    setupChat();

    return () => {
      ws.current?.close();
      if (interval) clearInterval(interval);
    };
  }, [activeEventId]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [{
      id: tempId,
      text,
      sender: 'self',
      username: user?.username,
    }, ...prev]);
    setInputText('');
    setSending(true);

    try {
      const res = await api.post(`/chat/${activeEventId}`, { content: text });
      const data = res.data;
      if (data) {
        setMessages(prev => prev.map(m =>
          m.id === tempId
            ? { id: data.id.toString(), text: data.content, sender: 'self', username: user?.username }
            : m
        ));
      }
    } catch (err) {
      console.log('Failed to send message', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    } finally {
      setSending(false);
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.bottomTabBorderColor,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventAvatar: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventAvatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    headerTextContainer: {
      justifyContent: 'center',
      gap: 1,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    messagesList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputWrapper: {
      borderTopWidth: 1,
      borderTopColor: theme.bottomTabBorderColor,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.surface,
      color: theme.text,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      maxHeight: 112,
      lineHeight: 20,
      borderWidth: 1,
      borderColor: theme.bottomTabBorderColor,
    },
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.35,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.eventAvatar}>
              <Text style={styles.eventAvatarText}>E</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Event Chat</Text>
              <Text style={styles.headerSubtitle}>Open to attendees</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble text={item.text} sender={item.sender} username={item.username} />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
        />

        {/* Input bar */}
        <View style={[styles.inputWrapper, { paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.placeholderText}
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={17} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;