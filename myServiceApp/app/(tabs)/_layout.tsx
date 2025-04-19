import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// Icon component with consistent styling
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: 0 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        headerShown: useClientOnlyValue(false, true),
        
        // Hide the tab bar completely
        tabBarStyle: { 
          display: 'none', // This completely hides the tab bar
        },
        
        // Make the background of the entire tab navigator transparent
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}>
      
      {/* Home route with header completely hidden */}
      <Tabs.Screen
        name="home"
        options={{
          title: '',
          headerShown: false, // This is the key line to hide the header for home
          headerTitle: '',
          headerTransparent: true,
        }}
      />
      
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: '',
          headerTransparent: true,
          headerBackground: () => (
            <View style={styles.headerBackground}>
              {Platform.OS === 'ios' && (
                <BlurView 
                  intensity={25} 
                  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                  style={StyleSheet.absoluteFill} 
                />
              )}
            </View>
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      
      <Tabs.Screen
        name="two"
        options={{
          title: '',
          headerTitle: '',
          headerTransparent: true,
          headerBackground: () => (
            <View style={styles.headerBackground}>
              {Platform.OS === 'ios' && (
                <BlurView 
                  intensity={25} 
                  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                  style={StyleSheet.absoluteFill} 
                />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          headerTitle: '',
          headerTransparent: true,
          headerBackground: () => (
            <View style={styles.headerBackground}>
              {Platform.OS === 'ios' && (
                <BlurView 
                  intensity={25} 
                  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                  style={StyleSheet.absoluteFill} 
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerBackground: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});