// app/(tabs)/home/screens/HomeScreenContent.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { auth, db } from '@/firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import StatusBarSpace from '@/app/components/StatusBarSpace';

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

  // fetch profile & tasker status once
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        user.displayName && setUserName(user.displayName.split(' ')[0]);
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

  // apply filterOptions client-side
  const applyFilters = async () => {
    setShowFilterModal(false);
    setIsLoading(true);
    let data = selectedCategory === 'All'
      ? await fetchAllServices()
      : await fetchServicesByCategory(selectedCategory);

    // filter & sort
    data = data
      .filter(s => s.rating >= filterOptions.minRating)
      .filter(s => parseInt(s.price.replace('Ksh','')) <= filterOptions.maxPrice)
      .filter(s => parseFloat(s.location) <= filterOptions.maxDistance)
      .sort((a,b) => filterOptions.sortBy === 'rating'
        ? b.rating - a.rating
        : filterOptions.sortBy === 'price'
        ? parseInt(a.price.replace('Ksh','')) - parseInt(b.price.replace('Ksh',''))
        : parseFloat(a.location) - parseFloat(b.location)
      );

    setServices(data);
    setIsLoading(false);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} onFilterPress={() => setShowFilterModal(true)} />
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

        {services.length > 0 ? (
          services.map(s => <ServiceCard key={s.id} service={s} />)
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={50} color={theme.colors.textLight} />
            <Text style={styles.noResultsText}>No services found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>

      <ProfileModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} userName={userName} />
      <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} filterOptions={filterOptions} setFilterOptions={setFilterOptions} onApply={applyFilters} />
      <CategoryListModal visible={showCategoryListModal} onClose={() => setShowCategoryListModal(false)} selectedCategory={selectedCategory} services={services} />
      <LocationModal visible={showLocationModal} onClose={() => setShowLocationModal(false)} currentLocation={cities[0]} cities={cities} onLocationChange={() => {}} />
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
}));