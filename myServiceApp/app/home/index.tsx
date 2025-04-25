import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

// Screens
import HomeScreenContent from './screens/HomeScreenContent';
import NotificationsScreen from './screens/NotificationsScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Check authentication state when component mounts
  useEffect(() => {
    console.log("Setting up auth state listener in Tab Navigator");
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated in Tab Navigator:", user.email);
        setIsAuthChecking(false);
      } else {
        console.log("No authenticated user found in Tab Navigator, redirecting to login");
        router.replace('/auth/Login');
      }
    });
    
    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Show loading indicator while checking authentication
  if (isAuthChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home-outline';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary, // Use the primary color (green) for active icons
        tabBarInactiveTintColor: theme.colors.tabBarInactiveTint,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreenContent} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const createStyles = createThemedStyles(theme => ({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
}));

export default HomeScreen;