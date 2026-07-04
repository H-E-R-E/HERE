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
import { getFirstLetter } from '../../utils/getFirstLetter';
import { useAuth } from '../../context/AuthContext';
import MessageTile from '../../components/MessageTile';
import { useChatSocket } from '../hooks/useChatSocket';


const ChatScreen = () => {
  const theme = useThemeColors();
  const { eventName, eventId } = useLocalSearchParams<{ eventName: string, eventId: string }>();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const id = Number(eventId);
  
  
  const { messages, sendMessage, status } = useChatSocket({
    eventId: id,
  });

  useEffect(() => {
    console.log("WS Status: ", status)
  }, [status])

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    
    const success = await sendMessage(text);
    
    if (success) {
      setInputText('');
    } else {
      console.log("Message failed to send completely.");
    }
    
    setSending(false);
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
              <Text style={styles.eventAvatarText}>{getFirstLetter(eventName)}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{`${eventName} Chat`}</Text>
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
            <MessageTile 
              username={item.username} 
              content={item.content} 
            />
          )}
          keyExtractor={item => item.id.toString()}
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
              onPress={handleSend}
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