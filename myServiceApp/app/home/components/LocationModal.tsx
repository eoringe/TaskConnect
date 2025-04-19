// app/(tabs)/home/components/LocationModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { City } from '../types';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  currentLocation: City;
  cities: City[];
  onLocationChange: (location: City) => void;
}

const LocationModal = ({ visible, onClose, currentLocation, cities, onLocationChange }: LocationModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.locationModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cities}
            style={styles.cityList}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cityItem,
                  currentLocation.name === item.name && styles.selectedCityItem
                ]}
                onPress={() => onLocationChange(item)}
              >
                <View style={styles.cityItemLeft}>
                  <Ionicons name="location" size={20} color="#4A80F0" />
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.countryName}>{item.country}</Text>
                </View>
                {currentLocation.name === item.name && (
                  <Ionicons name="checkmark-circle" size={20} color="#4A80F0" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '90%',
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
});

export default LocationModal;