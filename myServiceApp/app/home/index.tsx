import React from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // For icons

const Tab = createBottomTabNavigator();

const HomeScreenContent = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for services"
        />
        <Ionicons name="search" size={24} color="#888" style={styles.searchIcon} />
      </View>

      {/* Service Categories */}
      <Text style={styles.categoryTitle}>Service Categories</Text>
      <View style={styles.categoriesContainer}>
        <TouchableOpacity style={styles.categoryItem}>
          <Text style={styles.categoryText}>Chefs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryItem}>
          <Text style={styles.categoryText}>Plumbers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryItem}>
          <Text style={styles.categoryText}>Electricians</Text>
        </TouchableOpacity>
        {/* Add more categories */}
      </View>

      {/* Services Near Me (Dynamic data will go here) */}
      <Text style={styles.nearbyServicesTitle}>Services Near You</Text>
      {/* Placeholder for service listings */}
      <View style={styles.serviceCard}>
        <Text style={styles.serviceName}>Amazing Plumber</Text>
        <Text style={styles.serviceLocation}>5 km away</Text>
        {/* ... more details ... */}
      </View>
      <View style={styles.serviceCard}>
        <Text style={styles.serviceName}>Top Chef</Text>
        <Text style={styles.serviceLocation}>10 km away</Text>
        {/* ... more details ... */}
      </View>
      {/* ... more service cards ... */}
    </ScrollView>
  );
};

const NotificationsScreen = () => (
  <View style={styles.center}>
    <Text>Notifications</Text>
  </View>
);

const MessagesScreen = () => (
  <View style={styles.center}>
    <Text>Messages</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.center}>
    <Text>Settings</Text>
  </View>
);

const HomeScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: "home" | "home-outline" | "notifications" | "notifications-outline" | "chatbubbles" | "chatbubbles-outline" | "settings" | "settings-outline" = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'blue', // Customize active tab color
        tabBarInactiveTintColor: 'gray', // Customize inactive tab color
        headerShown: false, // Hide the default header
      })}
    >
      <Tab.Screen name="Home" component={HomeScreenContent} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8', // Light background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryItem: {
    backgroundColor: '#e0f7fa', // Light blue/teal
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00838f', // Darker blue/teal
  },
  nearbyServicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  serviceLocation: {
    color: '#888',
    fontSize: 12,
  },
});

export default HomeScreen;