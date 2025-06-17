// app/(tabs)/chat/ChatListScreen.tsx

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { router } from 'expo-router'; // Import router from expo-router
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

// Define the structure for a static chat item
interface StaticChatListItem {
  id: string;
  otherParticipantName: string;
  otherParticipantId: string; // Unique ID for the other participant (even if static)
  otherParticipantPhoto: string; // URL or local asset path for profile picture
  lastMessage: string;
  lastMessageTimestamp: string; // String for static display
  unreadCount: number;
}

// Dummy data for chat list
const STATIC_CHATS: StaticChatListItem[] = [
  {
    id: 'chat_1',
    otherParticipantName: 'Alice Johnson',
    otherParticipantId: 'alice_uid',
    otherParticipantPhoto: 'https://i.pravatar.cc/150?img=1', // Example avatar
    lastMessage: 'Hey, are you free for a call later?',
    lastMessageTimestamp: '10:30 AM',
    unreadCount: 2,
  },
  {
    id: 'chat_2',
    otherParticipantName: 'Bob Williams',
    otherParticipantId: 'bob_uid',
    otherParticipantPhoto: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'Project update: meeting is postponed to Friday.',
    lastMessageTimestamp: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'chat_3',
    otherParticipantName: 'Charlie Brown',
    otherParticipantId: 'charlie_uid',
    otherParticipantPhoto: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Can you send me the documents?',
    lastMessageTimestamp: 'Mon',
    unreadCount: 1,
  },
  {
    id: 'chat_4',
    otherParticipantName: 'Diana Prince',
    otherParticipantId: 'diana_uid',
    otherParticipantPhoto: 'https://i.pravatar.cc/150?img=4',
    lastMessage: 'See you there!',
    lastMessageTimestamp: 'Apr 15',
    unreadCount: 0,
  },
];

const ChatListScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets(); // Get safe area insets

  // Function to navigate to the ChatRoomScreen using expo-router
  const navigateToChatRoom = (chatItem: StaticChatListItem) => {
    // Pass all relevant details to the chat room
    router.push({
      pathname: `/home/screens/ChatRoomScreen`, // Adjust this path based on your expo-router file structure
      params: {
        chatId: chatItem.id,
        otherParticipantName: chatItem.otherParticipantName,
        otherParticipantId: chatItem.otherParticipantId,
        otherParticipantPhoto: chatItem.otherParticipantPhoto,
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}> {/* Apply safe area top inset + additional padding */}
      <Text style={styles.headerTitle}>Your Chats</Text>

      {STATIC_CHATS.length === 0 ? (
        <View style={[styles.emptyChatsContainer, styles.centerContent]}> {/* Separate style for empty state */}
          <Ionicons name="chatbubbles-outline" size={60} color={theme.colors.textLight} />
          <Text style={styles.noChatsText}>No chats yet.</Text>
          <Text style={styles.noChatsSubText}>Start a conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={STATIC_CHATS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => navigateToChatRoom(item)}
            >
              {item.otherParticipantPhoto ? (
                <Image source={{ uri: item.otherParticipantPhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-circle-outline" size={40} color={theme.colors.textLight} />
                </View>
              )}
              <View style={styles.chatContent}>
                <Text style={styles.chatPartnerName}>{item.otherParticipantName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={styles.timestamp}>{item.lastMessageTimestamp}</Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const createStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // paddingTop handled dynamically by insets
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 20,
    marginBottom: 20, // Added margin below title
  },
  emptyChatsContainer: { // New style for empty state container
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, // Add some padding to push it up slightly from the very bottom
  },
  noChatsText: {
    fontSize: 18,
    color: theme.colors.textLight,
    marginTop: 15,
    fontWeight: '600',
  },
  noChatsSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: theme.colors.card,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
  },
  chatPartnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
}));

export default ChatListScreen;