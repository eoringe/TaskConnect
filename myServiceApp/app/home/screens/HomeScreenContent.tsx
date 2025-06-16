// app/(tabs)/home/screens/HomeScreenContent.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { auth, db } from '@/firebase-config'; // Import db from firebase-config
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import StatusBarSpace from '@/app/components/StatusBarSpace';

// Components
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BannerCarousel from '../components/BannerCarousel'; // Import the new BannerCarousel
import BecomeTaskerCard from '../components/BecomeTaskerCard';
import CategoryScroll from '../components/CategoryScroll';
import ServiceCard from '../components/ServiceCard';
import FilterModal from '../components/FilterModal';
import LocationModal from '../components/LocationModal';
import CategoryListModal from '../components/CategoryListModal';
import ProfileModal from '../components/ProfileModal';

// Data & Types
import { allServices, cities } from '../data/mockData';
import { Service } from '../types';

// Define City type locally since it's not exported from '../types'
type City = {
  name: string;
  latitude: number;
  longitude: number;
};

// Define FilterOptions type here if not exported from '../types'
type FilterOptions = {
  minRating: number;
  maxPrice: number;
  maxDistance: number;
  sortBy: 'rating' | 'price' | 'distance';
};

const HomeScreenContent = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isWeb = Platform.OS === 'web';
  const [services, setServices] = useState<Service[]>(allServices.slice(0, 5));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentLocation, setCurrentLocation] = useState<City>(cities[0]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minRating: 4.0,
    maxPrice: 7000,
    maxDistance: 10,
    sortBy: 'rating'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Set to true initially to fetch user data
  const [userName, setUserName] = useState('User');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isTasker, setIsTasker] = useState<boolean | null>(null); // State to hold tasker status

  useEffect(() => {
    const fetchUserDataAndTaskerStatus = async () => {
      setIsLoading(true);
      const currentUser = auth.currentUser;

      if (currentUser) {
        if (currentUser.displayName) {
          const firstName = currentUser.displayName.split(' ')[0];
          setUserName(firstName);
        }

        if (currentUser.photoURL) {
          setUserPhoto(currentUser.photoURL);
        }

        // Check if the user has a tasker profile
        try {
          const taskerDocRef = doc(db, 'taskers', currentUser.uid);
          const docSnap = await getDoc(taskerDocRef);
          setIsTasker(docSnap.exists());
        } catch (error) {
          console.error("Error checking tasker profile:", error);
          setIsTasker(false); // Assume not a tasker on error
        }
      } else {
        setIsTasker(false); // Not logged in, so not a tasker
      }
      setIsLoading(false); // Set loading to false after fetching initial data
    };

    fetchUserDataAndTaskerStatus();
  }, []);

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
    }, 500);
  };

  const handleSeeAll = () => {
    setShowCategoryListModal(true);
  };

  const applyFilters = () => {
    setIsLoading(true);

    setTimeout(() => {
      let filtered = [...allServices];

      filtered = filtered.filter(service => service.rating >= filterOptions.minRating);
      filtered = filtered.filter(service =>
        parseInt(service.price.replace('Ksh', '').split('/')[0]) <= filterOptions.maxPrice
      );
      filtered = filtered.filter(service =>
        parseFloat(service.location.replace(' km away', '')) <= filterOptions.maxDistance
      );

      if (selectedCategory !== 'All') {
        filtered = filtered.filter(service => service.category === selectedCategory);
      }

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
    }, 800);
  };

  const changeLocation = (location: City) => {
    setIsLoading(true);
    setCurrentLocation(location);

    setTimeout(() => {
      setServices(allServices
        .sort(() => 0.5 - Math.random())
        .slice(0, 5));
      setShowLocationModal(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBarSpace />
      <Header
        userName={userName}
        onProfilePress={() => setShowProfileModal(true)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilterModal(true)}
        />

        {/* Use the new BannerCarousel here */}
        <BannerCarousel />

        {/* Conditionally render BecomeTaskerCard */}
        {isTasker === false && <BecomeTaskerCard />}

        {/* Wrapped Categories title in a View to apply marginHorizontal */}
        <View style={styles.categorySectionWrapper}>
          <Text style={styles.sectionTitleText}>Categories</Text>
        </View>

        <CategoryScroll
          selectedCategory={selectedCategory}
          onCategorySelect={filterByCategory}
        />

        <View style={styles.sectionHeader}>
          {/* Using sectionTitleText for horizontal alignment with Categories */}
          <Text style={styles.sectionTitleText}>
            {selectedCategory === 'All' ? 'Top Rated Services' : selectedCategory + ' Services'}
          </Text>
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {services.length > 0 ? (
          services.map((service: Service, i: number) => (
            <React.Fragment key={i}>
              <ServiceCard service={service} />
            </React.Fragment>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color={theme.colors.textLight} />
            <Text style={styles.noResultsText}>No services found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userName={userName}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
        onApply={applyFilters}
      />

      <CategoryListModal
        visible={showCategoryListModal}
        onClose={() => setShowCategoryListModal(false)}
        selectedCategory={selectedCategory}
        services={selectedCategory === 'All'
          ? allServices
          : allServices.filter(service => service.category === selectedCategory)}
      />

      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={currentLocation}
        cities={cities}
        onLocationChange={changeLocation}
      />
    </View>
  );
};

const createStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.dark
      ? 'rgba(0, 0, 0, 0.7)'
      : 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // New style for the actual text properties of section titles
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  // Wrapper for "Categories" title to apply horizontal margin and vertical spacing
  categorySectionWrapper: {
    marginHorizontal: 20,
    marginTop: -35, // Adjusted to reduce space above the title
    marginBottom: 30, // Keep this as per previous instruction
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20, // This correctly applies margin to the whole header row
    marginTop: 20, // Increased margin above "Top Rated Services" from 0 (default) to 20
    marginBottom: 15,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
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
    color: theme.colors.text,
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 5,
  },
}));

export default HomeScreenContent;
