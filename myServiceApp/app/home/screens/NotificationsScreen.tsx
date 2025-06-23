// app/(tabs)/home/screens/NotificationsScreen.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookedTasksList from '../components/BookedTasksList';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Booked Tasks</Text>
        <Text style={styles.subtitle}>Here you can view all the services you have booked, their status, and details.</Text>
        <BookedTasksList />
      </View>
    </SafeAreaView>
  );
};

const createStyles = createThemedStyles(theme => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 12,
    paddingBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 20,
    marginBottom: 10,
  },
}));

export default NotificationsScreen;