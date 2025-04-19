// app/(tabs)/home/components/BecomeTaskerCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BecomeTaskerCard = () => {
  const router = useRouter();
  
  const handleBecomeTasker = () => {
    router.push('/tasker-onboarding/personal-details');
  };

  return (
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
  );
};

const styles = StyleSheet.create({
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
});

export default BecomeTaskerCard;