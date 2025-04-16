// File: app/auth/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitle: "Login", // Setting the title explicitly to "Login"
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
        },
        headerTintColor: '#fff',
        headerBackground: () => (
          <View style={styles.headerBackground}>
            {Platform.OS === 'ios' && (
              <BlurView
                intensity={25}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Login", // This ensures the title is "Login" instead of "auth/index"
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0,0,0,0.5)',
  },
});