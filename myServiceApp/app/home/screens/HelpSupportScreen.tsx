import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

const BOT_NAME = 'TaskConnect Bot';
const BACKEND_URL = 'https://262e-197-237-175-62.ngrok-free.app/chat';

const cannedResponses = [
  { q: /your name|who are you|what is your name|who is this|who am i chatting with/i, a: 'My name is Ella, the official TaskConnect chat bot.' },
  { q: /help|support|problem|issue/i, a: 'How can I assist you? You can ask about booking, payments, or using TaskConnect.' },
  { q: /what is taskconnect|about/i, a: 'TaskConnect is a platform to connect you with trusted service providers for all your needs.' },
  { q: /how.*book/i, a: 'To book a service, search for what you need, select a provider, and follow the booking steps.' },
  { q: /payment|pay|mpesa/i, a: 'We support M-PESA, card, and cash payments. All payments are secure.' },
  { q: /contact|email|phone/i, a: 'You can reach our support team at support@taskconnect.com.' },
  { q: /.*/, a: 'Sorry, I am a simple bot for now. Please contact support@taskconnect.com for more help.' }
];

const HelpSupportScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am Ella. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('@/assets/images/Ella.jpg')}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#eee' }}
          />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>Ella</Text>
        </View>
      ),
    });
  }, [navigation, theme.colors.text, insets.top]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
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
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I could not connect to support right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const inputPaddingBottom = isKeyboardVisible ? 0 : 24;
  const inputMarginBottom = 0;

  const keyboardVerticalOffset = Platform.select({ ios: insets.top + 120, android: insets.top + 60 });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, idx) => (
              <View key={idx} style={[styles.messageRow, msg.from === 'user' ? styles.userRow : styles.botRow]}>
                {msg.from === 'bot' && <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} style={styles.botIcon} />}
                <View style={[styles.messageBubble, msg.from === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={[styles.messageRow, styles.botRow]}>
                <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} style={styles.botIcon} />
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <Text style={styles.messageText}>...</Text>
                </View>
              </View>
            )}
          </ScrollView>
          <Animated.View
            style={[
              styles.inputContainer,
              { paddingBottom: inputPaddingBottom, marginBottom: inputMarginBottom }
            ]}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Type your question..."
                placeholderTextColor={theme.colors.textLight}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  chatContent: {
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botIcon: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: theme.colors.text,
    fontSize: 16,
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
}));

export default HelpSupportScreen; 