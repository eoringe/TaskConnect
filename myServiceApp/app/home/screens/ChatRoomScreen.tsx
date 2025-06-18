// app/home/screens/ChatRoomScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define the structure for a static message object
interface StaticMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

// --- Dummy Data for Static Chat Rooms ---
const STATIC_MESSAGES_CHAT_1: StaticMessage[] = [
  { id: 'msg_1_1', senderId: 'my_uid', text: 'Hi Alice!', timestamp: '10:00 AM' },
  { id: 'msg_1_2', senderId: 'alice_uid', text: 'Hey there! How can I help you?', timestamp: '10:01 AM' },
  { id: 'msg_1_3', senderId: 'my_uid', text: 'I need some help with my task.', timestamp: '10:02 AM' },
  { id: 'msg_1_4', senderId: 'alice_uid', text: 'Sure, tell me more about it.', timestamp: '10:03 AM' },
  { id: 'msg_1_5', senderId: 'my_uid', text: 'It involves plumbing work at my house.', timestamp: '10:04 AM' },
  { id: 'msg_1_6', senderId: 'alice_uid', text: 'Okay, I understand. Can you describe the issue in more detail?', timestamp: '10:05 AM' },
  { id: 'msg_1_7', senderId: 'my_uid', text: 'The sink is leaking pretty bad, and the water pressure is low.', timestamp: '10:06 AM' },
  { id: 'msg_1_8', senderId: 'alice_uid', text: 'Got it. I can come by tomorrow morning to take a look if that works for you?', timestamp: '10:07 AM' },
  { id: 'msg_1_9', senderId: 'my_uid', text: 'Tomorrow morning works perfectly. What time roughly?', timestamp: '10:08 AM' },
  { id: 'msg_1_10', senderId: 'alice_uid', text: 'How about 9 AM?', timestamp: '10:09 AM' },
  { id: 'msg_1_11', senderId: 'my_uid', text: 'Sounds good! See you then.', timestamp: '10:10 AM' },
];

const STATIC_MESSAGES_CHAT_2: StaticMessage[] = [
  { id: 'msg_2_1', senderId: 'my_uid', text: 'Good morning Bob!', timestamp: '09:00 AM' },
  { id: 'msg_2_2', senderId: 'bob_uid', text: 'Morning! What\'s up?', timestamp: '09:01 AM' },
  { id: 'msg_2_3', senderId: 'my_uid', text: 'Just checking in about the project.', timestamp: '09:02 AM' },
  { id: 'msg_2_4', senderId: 'bob_uid', text: 'All good on my end. Will send updates soon.', timestamp: '09:03 AM' },
];

const ALL_STATIC_MESSAGES: { [key: string]: StaticMessage[] } = {
  'chat_1': STATIC_MESSAGES_CHAT_1,
  'chat_2': STATIC_MESSAGES_CHAT_2,
  'chat_3': [],
  'chat_4': [],
};

const ChatRoomScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const { chatId, otherParticipantName, otherParticipantId, otherParticipantPhoto } = useLocalSearchParams<{
    chatId: string;
    otherParticipantName: string;
    otherParticipantId: string;
    otherParticipantPhoto: string;
  }>();

  const [messageText, setMessageText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList<StaticMessage>>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const messages = ALL_STATIC_MESSAGES[chatId || ''] || [];
  const MY_STATIC_UID = 'my_uid';

  // Enhanced keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      
      // Animate the input container
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();

      // Scroll to end when keyboard appears
      setTimeout(() => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      
      // Animate back to original position
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [messages.length]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log(`Sending message in chat ${chatId}: ${messageText}`);
      setMessageText('');
      
      // Scroll to end after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item, index }: { item: StaticMessage; index: number }) => {
    const isMyMessage = item.senderId === MY_STATIC_UID;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          { marginBottom: isLastMessage ? 10 : 8 }
        ]}
      >
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}>
          <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
            {item.text}
          </Text>
          <View style={styles.timestampAndStatus}>
            <Text style={[
              styles.messageTimestamp,
              isMyMessage ? styles.myMessageTimestamp : styles.otherMessageTimestamp
            ]}>
              {item.timestamp}
            </Text>
            {isMyMessage && (
              <Ionicons
                name="checkmark-done"
                size={12}
                color="rgba(255,255,255,0.8)"
                style={styles.sentIcon}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const handleGoBackPress = () => {
    router.back();
  };

  // Calculate dynamic bottom padding for input container
  const inputContainerBottomPadding = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [insets.bottom, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.card}
      />
      
      {/* Enhanced Header */}
      <View >
        <View style={styles.headerContent}>
      
          
          <View style={styles.headerProfile}>
            <View style={styles.avatarContainer}>
              {otherParticipantPhoto ? (
                <Image source={{ uri: otherParticipantPhoto }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color={theme.colors.textLight} />
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherParticipantName}
              </Text>
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages Container */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.messagesWrapper}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesListContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              onLayout={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Enhanced Input Container */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            paddingBottom: inputContainerBottomPadding,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -keyboardHeight + insets.bottom],
              })
            }]
          }
        ]}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Ionicons name="add" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          
          {messageText.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton} activeOpacity={0.7}>
              <Ionicons name="mic" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// Enhanced Stylesheet
const createStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 56,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '400',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesListContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    width: '100%',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: '15%',
  },
  otherMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
    marginRight: '15%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  myMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },
  otherMessageText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },
  timestampAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  messageTimestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  myMessageTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTimestamp: {
    color: theme.colors.textLight,
  },
  sentIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 50,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 120,
    minHeight: 42,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
}));

export default ChatRoomScreen;