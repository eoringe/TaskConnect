// app/(tabs)/home/components/ServiceCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const router = useRouter();

  return (
    <View style={styles.serviceCard}>
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
          pathname: "/home/screens/bookingScreen",
          params: { tasker: JSON.stringify(service) }
        })}
      >
        <Text style={styles.bookBtnText}>Book</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.bookBtnIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default ServiceCard;