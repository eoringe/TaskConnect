// app/(tabs)/home/screens/HomeScreenContent.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Image } from 'react-native';
import { auth, db } from '@/firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import StatusBarSpace from '@/app/components/StatusBarSpace';
import { useRouter } from 'expo-router';

// Components
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BannerCarousel from '../components/BannerCarousel';
import BecomeTaskerCard from '../components/BecomeTaskerCard';
import CategoryScroll from '../components/CategoryScroll';
import ServiceCard from '../components/ServiceCard';
import FilterModal from '../components/FilterModal';
import LocationModal from '../components/LocationModal';
import CategoryListModal from '../components/CategoryListModal';
import ProfileModal from '../components/ProfileModal';

// Types & API
import { fetchAllServices, fetchServicesByCategory } from '../api/service';
import { Service } from '../types';
import { allServices, cities } from '../data/mockData';

// Local types
type City = { name: string; latitude: number; longitude: number };
type FilterOptions = { minRating: number; maxPrice: number; maxDistance: number; sortBy: 'rating' | 'price' | 'distance' };

export default function HomeScreenContent() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  // state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ minRating: 4.0, maxPrice: 7000, maxDistance: 10, sortBy: 'rating' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isTasker, setIsTasker] = useState<boolean>(false);
  const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // fetch profile & tasker status once
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        // Try to get firstName from users collection first
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.firstName) {
              setUserName(userData.firstName);
            } else if (user.displayName) {
              // Fallback to first part of displayName if firstName not available
              setUserName(user.displayName.split(' ')[0]);
            }
          } else if (user.displayName) {
            // Fallback to first part of displayName if no user document
            setUserName(user.displayName.split(' ')[0]);
          }
        } catch (error) {
          // Fallback to first part of displayName if error occurs
          if (user.displayName) {
            setUserName(user.displayName.split(' ')[0]);
          }
        }
        
        user.photoURL && setUserPhoto(user.photoURL);
        try {
          const snap = await getDoc(doc(db, 'taskers', user.uid));
          setIsTasker(snap.exists());
        } catch {
          setIsTasker(false);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  // whenever category changes, reload services
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = selectedCategory === 'All'
          ? await fetchAllServices()
          : await fetchServicesByCategory(selectedCategory);
        setServices(data);
      } catch (e) {
        console.error('Error loading services:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedCategory]);

  // Combined search and filter logic
  const filteredServices = services
    .filter(s => {
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.taskerName && s.taskerName.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    })
    .filter(s => s.rating >= filterOptions.minRating)
    .filter(s => parseInt(s.price.replace('Ksh', '')) <= filterOptions.maxPrice)
    .filter(s => parseFloat(s.location) <= filterOptions.maxDistance)
    .sort((a, b) => filterOptions.sortBy === 'rating'
      ? b.rating - a.rating
      : filterOptions.sortBy === 'price'
        ? parseInt(a.price.replace('Ksh', '')) - parseInt(b.price.replace('Ksh', ''))
        : parseFloat(a.location) - parseFloat(b.location)
    );

  // Prepare dropdown results for SearchBar
  const searchResults = searchQuery.trim()
    ? services
      .filter(s => {
        const q = searchQuery.trim().toLowerCase();
        return (
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.taskerName && s.taskerName.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      })
      .slice(0, 8) // limit results
      .map(s => ({
        id: s.id,
        title: s.title || s.name,
        subtitle: `${s.taskerName || s.name} • ${s.category}`,
        onPress: async () => {
          setIsBookingLoading(true);
          try {
            await router.push({
              pathname: "/home/screens/bookingScreen",
              params: { tasker: JSON.stringify(s) }
            });
          } catch (error) {
            console.error('Error navigating to booking screen:', error);
            alert('Unable to proceed with booking. Please try again.');
          } finally {
            setIsBookingLoading(false);
          }
        },
        profileImage: s.taskerProfileImage || null,
      }))
    : [];

  // Just close the modal on apply
  const applyFilters = () => {
    setShowFilterModal(false);
  };

  // Floating Ella chat button handler
  const handleEllaChat = () => {
    router.push('/home/screens/HelpSupportScreen');
  };

  return (
    <View style={styles.container}>
      <StatusBarSpace />
      <Header userName={userName} onProfilePress={() => setShowProfileModal(true)} />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {isBookingLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
        results={searchResults}
        onDismiss={() => setSearchQuery('')}
        loading={!!(isLoading && searchQuery.trim())}
      />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <BannerCarousel />
        {!isTasker && <BecomeTaskerCard />}

        <View style={styles.categorySectionWrapper}>
          <Text style={styles.sectionTitleText}>Categories</Text>
        </View>

        <CategoryScroll
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>
            {selectedCategory === 'All' ? 'Top Rated Services' : `${selectedCategory} Services`}
          </Text>
          <TouchableOpacity onPress={() => setShowCategoryListModal(true)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {filteredServices.length > 0 ? (
          filteredServices.map((s, idx) => <ServiceCard key={s.id + '-' + idx} service={s} />)
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color={theme.colors.textLight} />
            <Text style={styles.noResultsText}>No services found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters or search</Text>
          </View>
        )}
      </ScrollView>

      <ProfileModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} userName={userName} />
      <FilterModal visible={showFilterModal} onClose={applyFilters} filterOptions={filterOptions} setFilterOptions={setFilterOptions} onApply={applyFilters} />
      <CategoryListModal visible={showCategoryListModal} onClose={() => setShowCategoryListModal(false)} selectedCategory={selectedCategory} services={services} />
      <LocationModal visible={showLocationModal} onClose={() => setShowLocationModal(false)} currentLocation={cities[0]} cities={cities} onLocationChange={() => { }} />

      {/* Floating Ella Chat Button */}
      <TouchableOpacity
        style={styles.ellaFab}
        activeOpacity={0.85}
        onPress={handleEllaChat}
      >
        <Image
          source={require('@/assets/images/Ella.jpg')}
          style={styles.ellaFabAvatar}
        />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = createThemedStyles(theme => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  scrollContent: { paddingBottom: 30 },
  sectionTitleText: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  categorySectionWrapper: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginVertical: 15 },
  seeAllText: { color: theme.colors.primary, fontWeight: '600' },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, marginHorizontal: 20 },
  noResultsText: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginTop: 15 },
  noResultsSubtext: { fontSize: 14, color: theme.colors.textLight, marginTop: 5 },
  ellaFab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  ellaFabAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eee',
  },
}));