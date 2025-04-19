// app/(tabs)/home/screens/NotificationsScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NotificationsScreen = () => {
  return (
    <View style={styles.center}>
      <Text>Notifications</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
  },
});

export default NotificationsScreen;