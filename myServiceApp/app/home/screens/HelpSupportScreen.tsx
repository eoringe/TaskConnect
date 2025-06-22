import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

const BOT_NAME = 'TaskConnect Bot';
const BACKEND_URL = 'https://262e-197-237-175-62.ngrok-free.app/chat';

const cannedResponses = [
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
    { from: 'bot', text: 'Hi! I am the TaskConnect Bot. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Help & Support</Text>
      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
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
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your question..."
          placeholderTextColor={theme.colors.textLight}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
}));

export default HelpSupportScreen; 