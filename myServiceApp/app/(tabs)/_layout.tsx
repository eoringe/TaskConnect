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
        // Set active tint color based on theme
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        
        // Disable the static render of the header on web
        headerShown: useClientOnlyValue(false, true),
        
        // Make the tab bar transparent
        tabBarStyle: styles.tabBar,

      
        
        // Add padding for iOS devices with home indicator
        tabBarItemStyle: {
          paddingTop: 10,
        },
        
        // Customize the label style - hide the labels
        tabBarLabelStyle: { display: 'none' },
        
        // Make the background of the entire tab navigator transparent
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            {/* Optional: Add a very subtle blur effect */}
            {Platform.OS === 'ios' && (
              <BlurView 
                intensity={25} 
                tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                style={StyleSheet.absoluteFill} 
              />
            )}
            <View 
              style={[
                styles.tabBarBackgroundInner, 
                { 
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(30, 30, 30, 0.7)' 
                    : 'rgba(255, 255, 255, 0.7)' 
                }
              ]} 
            />
          </View>
        ),
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerTransparent: true, // Make header transparent too
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
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerTransparent: true, // Make header transparent too
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
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTransparent: true, // Make header transparent too
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
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    shadowOpacity: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  tabBarBackgroundInner: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(120, 120, 120, 0.2)',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerBackground: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});