import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, StatusBar, Modal, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebase-config'; // Adjust the path as needed
import { Alert } from 'react-native';
import { router } from 'expo-router'; // If you're using Expo Router for navigation
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import { Platform } from 'react-native';
// import SharedMap from './components/SharedMap'; // Ensure this file exists or update the path

type RootStackParamList = {
  Booking: { tasker: any };
  BookingSummary: {
    tasker: any;
    date: Date;
    address: string;
    notes: string;
  };
};



type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Booking'>;

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Mock data for services
const handleLogout = async () => {
  try {
    // Show confirmation alert
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Logout", 
          onPress: async () => {
            // Sign out from Firebase
            await auth.signOut();
            
            // Navigate to login screen
            router.replace('/'); // Adjust the route as needed
            
            // You can add additional cleanup here if needed
            console.log('User logged out successfully');
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error signing out:', error);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  }
};

const allServices = [
  { id: 1, name: 'Yvonne Karanja', category: 'Best Administrator', location: '2 km away', rating: 4.9, reviews: 42, price: 'Ksh 3500', coordinates: { latitude: -1.286389, longitude: 36.817223 } },
  { id: 2, name: 'Green Gardeners', category: 'Gardening', location: '4.5 km away', rating: 4.7, reviews: 38, price: 'Ksh 1500', coordinates: { latitude: -1.289389, longitude: 36.824223 } },
  { id: 3, name: 'HomeBright Cleaners', category: 'Cleaning', location: '6 km away', rating: 4.8, reviews: 56, price: 'Ksh 1000', coordinates: { latitude: -1.292389, longitude: 36.807223 } },
  { id: 4, name: 'FixIt Plumbers', category: 'Plumbing', location: '3.8 km away', rating: 4.6, reviews: 29, price: 'Ksh 2000', coordinates: { latitude: -1.281389, longitude: 36.820223 } },
  { id: 5, name: 'Style by Linda', category: 'Hair Stylist', location: '1.2 km away', rating: 4.9, reviews: 64, price: 'Ksh 2500', coordinates: { latitude: -1.287389, longitude: 36.812223 } },
  { id: 6, name: 'Paint Masters', category: 'Painting', location: '5.1 km away', rating: 4.5, reviews: 27, price: 'Ksh 1800', coordinates: { latitude: -1.295389, longitude: 36.825223 } },
  { id: 7, name: 'Baby Bliss Sitters', category: 'Baby Sitting', location: '2.9 km away', rating: 4.8, reviews: 46, price: 'Ksh 3000', coordinates: { latitude: -1.283389, longitude: 36.815223 } },
  { id: 8, name: 'QuickFix Movers', category: 'Moving', location: '7.3 km away', rating: 4.4, reviews: 31, price: 'Ksh 4000', coordinates: { latitude: -1.298389, longitude: 36.830223 } },
  { id: 9, name: 'Tech Rescue', category: 'Tech Help', location: '5.4 km away', rating: 4.7, reviews: 52, price: 'Ksh 5000', coordinates: { latitude: -1.288389, longitude: 36.822223 } },
  { id: 10, name: 'Chef Mambo', category: 'Chef', location: '1.9 km away', rating: 4.9, reviews: 73, price: 'Ksh 4000', coordinates: { latitude: -1.284389, longitude: 36.814223 } },
];

// Mock data for categories with icons
const categories = [
  { name: 'All', icon: 'grid' },
  { name: 'Cleaning', icon: 'md-shield-checkmark' },
  { name: 'Plumbing', icon: 'water' },
  { name: 'Electrical', icon: 'flash' },
  { name: 'Chef', icon: 'restaurant' },
  { name: 'Moving', icon: 'cube' },
  { name: 'Gardening', icon: 'leaf' },
  { name: 'Painting', icon: 'color-palette' },
  { name: 'Baby Sitting', icon: 'happy' },
  { name: 'Hair Stylist', icon: 'cut' },
  { name: 'AC Repair', icon: 'thermometer' },
  { name: 'Tech Help', icon: 'laptop' },
];

// Available cities
const cities = [
  { name: 'Nairobi', country: 'Kenya', coordinates: { latitude: -1.286389, longitude: 36.817223 } },
  { name: 'Mombasa', country: 'Kenya', coordinates: { latitude: -4.043740, longitude: 39.668808 } },
  { name: 'Kisumu', country: 'Kenya', coordinates: { latitude: -0.091702, longitude: 34.767956 } },
  { name: 'Nakuru', country: 'Kenya', coordinates: { latitude: -0.303099, longitude: 36.080025 } },
  { name: 'Eldoret', country: 'Kenya', coordinates: { latitude: 0.521060, longitude: 35.269440 } },
];

const HomeScreenContent = () => {
  const isWeb = Platform.OS === 'web';
  const [services, setServices] = useState(allServices.slice(0, 5));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentLocation, setCurrentLocation] = useState(cities[0]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    minRating: 4.0,
    maxPrice: 7000,
    maxDistance: 10,
    sortBy: 'rating' // 'rating', 'price', 'distance'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleBecomeTasker = () => {
    router.push('/tasker-onboarding/personal-details');
  };

  // Function to filter services based on category
  const filterByCategory = (category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);

    setTimeout(() => {
      if (category === 'All') {
        setServices(allServices.slice(0, 5));
      } else {
        const filtered = allServices.filter(service => service.category === category).slice(0, 5);
        setServices(filtered);
      }
      setIsLoading(false);
    }, 500); // Simulate loading
  };

  // Function to handle "See All" - Shows all services of current category
  const handleSeeAll = () => {
    setShowCategoryListModal(true);
  };

  // Function to apply filters
  const applyFilters = () => {
    setIsLoading(true);

    setTimeout(() => {
      let filtered = [...allServices];

      // Apply min rating filter
      filtered = filtered.filter(service => service.rating >= filterOptions.minRating);

      // Apply price filter (mock implementation)
      filtered = filtered.filter(service =>
        parseInt(service.price.replace('Ksh', '').split('/')[0]) <= filterOptions.maxPrice
      );

      // Apply distance filter (mock implementation)
      filtered = filtered.filter(service =>
        parseFloat(service.location.replace(' km away', '')) <= filterOptions.maxDistance
      );

      // Apply category filter if not "All"
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(service => service.category === selectedCategory);
      }

      // Apply sorting
      if (filterOptions.sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (filterOptions.sortBy === 'price') {
        filtered.sort((a, b) =>
          parseInt(a.price.replace('Ksh', '').split('/')[0]) -
          parseInt(b.price.replace('Ksh', '').split('/')[0])
        );
      } else if (filterOptions.sortBy === 'distance') {
        filtered.sort((a, b) =>
          parseFloat(a.location.replace(' km away', '')) -
          parseFloat(b.location.replace(' km away', ''))
        );
      }

      setServices(filtered.slice(0, 5));
      setShowFilterModal(false);
      setIsLoading(false);
    }, 800); // Simulate API call
  };

  // Function to change location
  const changeLocation = (location: React.SetStateAction<{ name: string; country: string; coordinates: { latitude: number; longitude: number; }; }>) => {
    setIsLoading(true);
    setCurrentLocation(location);

    setTimeout(() => {
      // Here you would typically make an API call to fetch services near the new location
      // For now, we'll just simulate a change
      setServices(allServices
        .sort(() => 0.5 - Math.random()) // Shuffle array
        .slice(0, 5)); // Get first 5
      setShowLocationModal(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Hi, James 👋</Text>
          <Text style={styles.subHeaderText}>Find trusted help nearby</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowProfileModal(true)}
        >
          <Ionicons name="person-circle" size={40} color="#4A80F0" />
        </TouchableOpacity>

      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A80F0" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={22} color="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="What do you need done?"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Featured Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Get 20% off</Text>
            <Text style={styles.bannerSubtitle}>on your first home cleaning</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerImageContainer}>
            <Ionicons name="home" size={60} color="#fff" style={styles.bannerImage} />
          </View>
        </View>
        <View style={styles.becomeTaskerCard}>
          <View style={styles.cardContent}>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Become a Tasker</Text>
              <Text style={styles.cardDescription}>
                Turn your skills into income. Join our community of professional taskers and start earning on your own schedule.
              </Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="time-outline" size={24} color="#4A80F0" />
                  <Text style={styles.benefitText}>Flexible Schedule</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="cash-outline" size={24} color="#4A80F0" />
                  <Text style={styles.benefitText}>Competitive Pay</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#4A80F0" />
                  <Text style={styles.benefitText}>Secure Platform</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.becomeTaskerButton}
                onPress={handleBecomeTasker}
              >
                <Text style={styles.becomeTaskerButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Category Scroll */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.categoryItem,
                selectedCategory === cat.name && styles.selectedCategoryItem
              ]}
              onPress={() => filterByCategory(cat.name)}
            >
              <View style={[
                styles.categoryIconContainer,
                selectedCategory === cat.name && styles.selectedCategoryIconContainer
              ]}>
                <Ionicons
                  name={cat.icon as any}
                  size={22}
                  color={selectedCategory === cat.name ? "#fff" : "#4A80F0"}
                />
              </View>
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.name && styles.selectedCategoryText
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Location */}
        {/* <View style={styles.locationContainer}>
          <Ionicons name="location" size={18} color="#FF6B6B" />
          <Text style={styles.locationText}>{currentLocation.name}, {currentLocation.country}</Text>
          <TouchableOpacity onPress={() => setShowLocationModal(true)}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View> */}

        {/* Top Rated Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Top Rated Services' : selectedCategory + ' Services'}
          </Text>
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Service Cards */}
        {services.length > 0 ? (
          services.map((service, i) => (
            <View key={i} style={styles.serviceCard}>
              <View style={styles.serviceCardTop}>
                <View style={styles.serviceImageContainer}>
                  <Ionicons name="person" size={36} color="#4A80F0" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                    <Text style={styles.reviewsText}>({service.reviews} reviews)</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#A0A0A0" />
                    <Text style={styles.serviceLocation}>{service.location}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Ionicons name="cash-outline" size={14} color="#4A80F0" />
                    <Text style={styles.priceText}>{service.price}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => router.push({
                  pathname: "/booking",
                  params: { tasker: JSON.stringify(service) }
                })}
              >
                <Text style={styles.bookBtnText}>Book</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.bookBtnIcon} />
              </TouchableOpacity>

            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color="#A0A0A0" />
            <Text style={styles.noResultsText}>No services found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
      {/* Profile Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowProfileModal(false)}
        >
        <View style={styles.profileModalContent}>
  <Text style={styles.profileModalTitle}>Hello James 👋</Text>
  <TouchableOpacity style={styles.profileOption}>
    <Ionicons name="person-outline" size={20} color="#4A80F0" />
    <Text style={styles.profileOptionText}>View Profile</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.profileOption}>
    <Ionicons name="settings-outline" size={20} color="#4A80F0" />
    <Text style={styles.profileOptionText}>Settings</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.profileOption}
    onPress={handleLogout}
  >
    <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
    <Text style={[styles.profileOptionText, { color: '#FF6B6B' }]}>Logout</Text>
  </TouchableOpacity>
</View>
        </TouchableOpacity>
      </Modal>



      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Services</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{filterOptions.minRating.toFixed(1)}</Text>
                <View style={styles.sliderTrack}>
                  {[3.0, 3.5, 4.0, 4.5, 5.0].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderMarker,
                        filterOptions.minRating >= value && styles.sliderMarkerActive
                      ]}
                      onPress={() => setFilterOptions({ ...filterOptions, minRating: value })}
                    />
                  ))}
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>3.0</Text>
                  <Text style={styles.sliderLabelText}>5.0</Text>
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Price (Ksh)</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>Ksh{filterOptions.maxPrice}</Text>
                <View style={styles.sliderTrack}>
                  {[500, 2000, 3500, 5000, 7000].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderMarker,
                        filterOptions.maxPrice >= value && styles.sliderMarkerActive
                      ]}
                      onPress={() => setFilterOptions({ ...filterOptions, maxPrice: value })}
                    />
                  ))}
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Ksh 500</Text>
                  <Text style={styles.sliderLabelText}>Ksh 7000</Text>
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Distance (km)</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{filterOptions.maxDistance} km</Text>
                <View style={styles.sliderTrack}>
                  {[2, 4, 6, 8, 10].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderMarker,
                        filterOptions.maxDistance >= value && styles.sliderMarkerActive
                      ]}
                      onPress={() => setFilterOptions({ ...filterOptions, maxDistance: value })}
                    />
                  ))}
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>2 km</Text>
                  <Text style={styles.sliderLabelText}>10 km</Text>
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {['rating', 'price', 'distance'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sortOption,
                      filterOptions.sortBy === option && styles.sortOptionActive
                    ]}
                    onPress={() => setFilterOptions({ ...filterOptions, sortBy: option })}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filterOptions.sortBy === option && styles.sortOptionTextActive
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setFilterOptions({
                  minRating: 4.0,
                  maxPrice: 7000,
                  maxDistance: 10,
                  sortBy: 'rating'
                })}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Change Modal */}
      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View> */}

      {/* Map View */}


      {/* <View style={styles.mapContainer}>
  {isWeb ? (
    <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#A0A0A0' }}>Map is unavailable on web.</Text>
    </View>
  ) : (
    (() => {
      const MapView = require('react-native-maps').default;
      const Marker = require('react-native-maps').Marker;
      const PROVIDER_GOOGLE = require('react-native-maps').PROVIDER_GOOGLE;

      return (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.coordinates.latitude,
            longitude: currentLocation.coordinates.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {cities.map((city, index) => (
            <Marker
              key={index}
              coordinate={city.coordinates}
              title={city.name}
              description={city.country}
              pinColor={currentLocation.name === city.name ? '#4A80F0' : '#FF6B6B'}
            />
          ))}
        </MapView>
      );
    })()
  )}
</View>



            
            <Text style={styles.locationListTitle}>Popular Cities</Text>
             */}
      {/* City List */}
      {/* <FlatList
              data={cities}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.cityItem,
                    currentLocation.name === item.name && styles.selectedCityItem
                  ]}
                  onPress={() => changeLocation(item)}
                >
                  <View style={styles.cityItemLeft}>
                    <Ionicons 
                      name="location" 
                      size={20} 
                      color={currentLocation.name === item.name ? "#4A80F0" : "#A0A0A0"} 
                    />
                    <View>
                      <Text style={styles.cityName}>{item.name}</Text>
                      <Text style={styles.countryName}>{item.country}</Text>
                    </View>
                  </View>
                  {currentLocation.name === item.name && (
                    <Ionicons name="checkmark-circle" size={22} color="#4A80F0" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.cityList}
            />
          </View>
        </View>
      </Modal> */}

      {/* Category List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryListModal}
        onRequestClose={() => setShowCategoryListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryListModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory === 'All' ? 'All Services' : selectedCategory + ' Services'}
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryListModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedCategory === 'All'
                ? allServices
                : allServices.filter(service => service.category === selectedCategory)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.serviceListItem}>
                  <View style={styles.serviceListItemTop}>
                    <View style={styles.serviceListImageContainer}>
                      <Ionicons name="person" size={30} color="#4A80F0" />
                    </View>
                    <View style={styles.serviceListInfo}>
                      <Text style={styles.serviceListName}>{item.name}</Text>
                      <View style={styles.serviceListMeta}>
                        <View style={styles.miniRatingContainer}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.miniRatingText}>{item.rating}</Text>
                        </View>
                        <Text style={styles.serviceListCategory}>{item.category}</Text>
                        <Text style={styles.serviceListPrice}>{item.price}</Text>
                      </View>
                      <View style={styles.serviceListLocation}>
                        <Ionicons name="location-outline" size={12} color="#A0A0A0" />
                        <Text style={styles.serviceListLocationText}>{item.location}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.miniBookBtn}
                      onPress={() => router.push({
                        pathname: "/booking",
                        params: { tasker: JSON.stringify(item) }
                      })}
                    >
                      <Text style={styles.miniBookBtnText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
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
        tabBarActiveTintColor: '#4A80F0',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreenContent} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 3,
  },
  avatarContainer: {
    height: 45,
    width: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 10,
    padding: 8,
  },
  bannerContainer: {
    backgroundColor: '#4A80F0',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#4A80F0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerContent: {
    flex: 3,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E0E8FF',
    marginTop: 5,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#4A80F0',
    fontWeight: '600',
  },
  bannerImageContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerImage: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    marginHorizontal: 20,
    color: '#333',
  },
  horizontalScroll: {
    marginBottom: 25,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 75,
  },
  selectedCategoryItem: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    height: 60,
    width: 60,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#4A80F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedCategoryIconContainer: {
    backgroundColor: '#4A80F0',
  },
  categoryText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#4A80F0',
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  changeText: {
    color: '#4A80F0',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4A80F0',
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImageContainer: {
    height: 65,
    width: 65,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 13,
    color: '#4A80F0',
    fontWeight: '600',
    marginLeft: 4,
  },
  serviceLocation: {
    fontSize: 13,
    color: '#A0A0A0',
    marginLeft: 4,
  },
  bookBtn: {
    marginTop: 15,
    backgroundColor: '#4A80F0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 5,
  },
  bookBtnIcon: {
    marginLeft: 3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  locationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  categoryListModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sliderContainer: {
    marginHorizontal: 10,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A80F0',
    textAlign: 'center',
    marginBottom: 10,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 10,
  },
  sliderMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginLeft: -8,
  },
  sliderMarkerActive: {
    borderColor: '#4A80F0',
    backgroundColor: '#4A80F0',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  sortOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  sortOptionActive: {
    backgroundColor: '#4A80F0',
    borderColor: '#4A80F0',
  },
  sortOptionText: {
    color: '#333',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginRight: 10,
  },
  resetButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: '#4A80F0',
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  cityList: {
    maxHeight: 300,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCityItem: {
    backgroundColor: '#F0F4FF',
  },
  cityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  countryName: {
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 10,
  },
  serviceListItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceListItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceListImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceListInfo: {
    flex: 1,
  },
  serviceListName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  miniRatingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  serviceListCategory: {
    fontSize: 12,
    color: '#4A80F0',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 10,
  },
  serviceListPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A80F0',
  },
  serviceListLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceListLocationText: {
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 4,
  },
  miniBookBtn: {
    backgroundColor: '#4A80F0',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  miniBookBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 5,
  },
  profileModalContent: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileOptionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  becomeTaskerCard: {
    margin: 20,
    borderRadius: 20,
    backgroundColor: '#f8f9fd',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardContent: {
    padding: 20,
  },
  cardTextContent: {
    gap: 15,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  benefitsList: {
    marginTop: 20,
    gap: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
  },
  becomeTaskerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A80F0',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  becomeTaskerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },

  servicesScroll: {
    marginLeft: -5,
  },

  serviceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stepIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }

});

export default HomeScreen;