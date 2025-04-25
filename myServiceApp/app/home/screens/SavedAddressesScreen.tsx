// app/(tabs)/home/screens/SavedAddressesScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth } from '@/firebase-config';
import { 
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  Address
} from '@/app/services/userDatabaseService';

const SavedAddressesScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address>({
    id: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });
  
  useEffect(() => {
    loadAddresses();
  }, []);
  
  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view this page.');
        router.back();
        return;
      }
      
      // Get addresses using our service
      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const openAddressModal = (address?: Address) => {
    if (address) {
      setCurrentAddress(address);
      setIsEditMode(true);
    } else {
      setCurrentAddress({
        id: Date.now().toString(), // Generate a unique ID
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: addresses.length === 0 // Make default if it's the first address
      });
      setIsEditMode(false);
    }
    setModalVisible(true);
  };
  
  const handleSaveAddress = async () => {
    // Basic validation
    if (!currentAddress.street || !currentAddress.city || !currentAddress.country) {
      Alert.alert('Missing Information', 'Please fill in at least street, city, and country.');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update addresses.');
        return;
      }
      
      if (isEditMode) {
        // Update existing address using our service
        await updateUserAddress(currentAddress);
      } else {
        // Add new address using our service
        await addUserAddress(currentAddress);
      }
      
      // Reload the addresses
      await loadAddresses();
      setModalVisible(false);
      Alert.alert('Success', `Address ${isEditMode ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} address. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const user = auth.currentUser;
              if (!user) return;
              
              // Delete address using our service
              await deleteUserAddress(addressId);
              
              // Reload addresses
              await loadAddresses();
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleSetDefault = async (addressId: string) => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Set default address using our service
      await setDefaultAddress(addressId);
      
      // Reload addresses
      await loadAddresses();
      Alert.alert('Success', 'Default address updated successfully');
    } catch (error) {
      console.error('Error updating default address:', error);
      Alert.alert('Error', 'Failed to update default address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderAddressItem = (address: Address) => (
    <View key={address.id} style={styles.addressItem}>
      <View style={styles.addressHeader}>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
        
        <View style={styles.addressActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => openAddressModal(address)}
          >
            <Ionicons name="create-outline" size={20} color="#5CBD6A" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteAddress(address.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.addressLine}>{address.street}</Text>
      <Text style={styles.addressLine}>
        {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}
      </Text>
      <Text style={styles.addressLine}>{address.country}</Text>
      
      {!address.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(address.id)}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Address form modal
  const renderAddressModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Street Address*</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.street}
              onChangeText={(text) => setCurrentAddress({...currentAddress, street: text})}
              placeholder="Enter your street address"
            />
            
            <Text style={styles.inputLabel}>City*</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.city}
              onChangeText={(text) => setCurrentAddress({...currentAddress, city: text})}
              placeholder="Enter your city"
            />
            
            <Text style={styles.inputLabel}>State/Province</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.state}
              onChangeText={(text) => setCurrentAddress({...currentAddress, state: text})}
              placeholder="Enter your state or province"
            />
            
            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.postalCode}
              onChangeText={(text) => setCurrentAddress({...currentAddress, postalCode: text})}
              placeholder="Enter your postal code"
              keyboardType="number-pad"
            />
            
            <Text style={styles.inputLabel}>Country*</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.country}
              onChangeText={(text) => setCurrentAddress({...currentAddress, country: text})}
              placeholder="Enter your country"
            />
            
            <View style={styles.defaultCheckbox}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  currentAddress.isDefault && styles.checkboxChecked
                ]}
                onPress={() => setCurrentAddress({
                  ...currentAddress,
                  isDefault: !currentAddress.isDefault
                })}
              >
                {currentAddress.isDefault && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveAddress}
          >
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  if (isLoading && addresses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5CBD6A" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No addresses saved yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first address to make checkout faster
            </Text>
          </View>
        ) : (
          addresses.map(address => renderAddressItem(address))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => openAddressModal()}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>
      
      {renderAddressModal()}
      
      {isLoading && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color="#5CBD6A" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space at the bottom for the floating button
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },
  addressItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  defaultBadge: {
    backgroundColor: 'rgba(92, 189, 106, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5CBD6A',
  },
  defaultBadgeText: {
    color: '#5CBD6A',
    fontSize: 12,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 6,
    marginRight: 10,
  },
  deleteButton: {
    padding: 6,
  },
  addressLine: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  setDefaultButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    color: '#5CBD6A',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#5CBD6A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  overlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    maxHeight: '80%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#5CBD6A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#5CBD6A',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#5CBD6A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavedAddressesScreen;