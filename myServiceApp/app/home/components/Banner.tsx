// app/(tabs)/home/components/Banner.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

const Banner = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  return (
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
  );
};

const createStyles = createThemedStyles(theme => ({
  bannerContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: theme.colors.primary,
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
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: theme.colors.primary,
    fontWeight: '600',
  },
  bannerImageContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerImage: {
    opacity: 0.8,
  },
}));

export default Banner;