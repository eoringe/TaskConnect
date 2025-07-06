// app/(tabs)/home/components/ServiceCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Service } from '../types';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Helper to handle both base64 and URL images
  const getImageSource = (img: string | null | undefined) => {
    console.log('🔍 DEBUG SERVICECARD IMAGE: Raw image data:', img?.substring(0, 50));
    console.log('🔍 DEBUG SERVICECARD IMAGE: Image length:', img?.length);
    console.log('🔍 DEBUG SERVICECARD IMAGE: Starts with data:image:', img?.startsWith('data:image'));
    console.log('🔍 DEBUG SERVICECARD IMAGE: Starts with http:', img?.startsWith('http'));
    
    if (!img) return undefined;
    if (img.startsWith('data:image')) {
      console.log('🔍 DEBUG SERVICECARD IMAGE: Using as data URI');
      return { uri: img };
    }
    // Heuristic: if it's a long string and not a URL, treat as base64
    if (!img.startsWith('http') && img.length > 100) {
      console.log('🔍 DEBUG SERVICECARD IMAGE: Converting to data URI');
      return { uri: `data:image/jpeg;base64,${img}` };
    }
    console.log('🔍 DEBUG SERVICECARD IMAGE: Using as URL');
    return { uri: img };
  };

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceCardTop}>
        <View style={styles.serviceImageContainer}>
          {service.taskerProfileImage ? (
            <Image
              source={getImageSource(service.taskerProfileImage)}
              style={{ width: 60, height: 60, borderRadius: 30, alignSelf: 'center' }}
              resizeMode="cover"
              onError={(error) => console.log('🔍 DEBUG SERVICECARD IMAGE ERROR:', error.nativeEvent)}
              onLoad={() => console.log('🔍 DEBUG SERVICECARD IMAGE LOADED SUCCESSFULLY')}
            />
          ) : (
            <Ionicons name="person" size={36} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.title}</Text>
          <Text style={styles.taskerName}>{service.taskerName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{service.rating}</Text>
            <Text style={styles.reviewsText}>({service.reviews} reviews)</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textLight} />
            <Text style={styles.serviceLocation}>{service.location}</Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.priceText}>{service.price}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => {
          try {
            console.log('🔍 DEBUG SERVICECARD: Service data being passed:', service);
            console.log('🔍 DEBUG SERVICECARD: Service bio:', (service as any).bio);
            console.log('🔍 DEBUG SERVICECARD: Service areas served:', (service as any).areasServed);
            console.log('🔍 DEBUG SERVICECARD: Service profile image:', !!service.taskerProfileImage);
            console.log('🔍 DEBUG SERVICECARD: Service services:', (service as any).services);
            router.push({
              pathname: "/home/screens/bookingScreen",
              params: { tasker: JSON.stringify(service) }
            });
          } catch (error) {
            console.error('Error navigating to booking screen:', error);
            alert('Unable to proceed with booking. Please try again.');
          }
        }}
      >
        <Text style={styles.bookBtnText}>Book</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.bookBtnIcon} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = createThemedStyles(theme => ({
  serviceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImageContainer: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: theme.dark ? 'rgba(92, 189, 106, 0.15)' : '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  taskerName: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontWeight: '500',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: theme.colors.textLight,
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
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  serviceLocation: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  bookBtn: {
    marginTop: 15,
    backgroundColor: theme.colors.primary,
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
}));

export default ServiceCard;