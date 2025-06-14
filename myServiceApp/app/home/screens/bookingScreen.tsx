import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import { auth } from '@/firebase-config';
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
  Address
} from '@/app/services/userDatabaseService';
import * as Location from 'expo-location';

type SearchParamTypes = {
  bookingScreen: {
    tasker: string;
  };
  bookingSummary: {
    tasker: string;
    date: string;
    address: string;
    notes: string;
  };
};

const BookingScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<SearchParamTypes['bookingScreen']>();
  const tasker = JSON.parse(params.tasker);

  const [date, setDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // For date selection
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  // For time selection
  const [selectedHour, setSelectedHour] = useState(date.getHours());
  const [selectedMinute, setSelectedMinute] = useState(date.getMinutes());
  const [selectedAmPm, setSelectedAmPm] = useState(date.getHours() >= 12 ? 'PM' : 'AM');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<Address>({
    id: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    isDefault: false
  });

  useEffect(() => {
    loadAddresses();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view saved addresses.');
        return;
      }

      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);

      // Set default address if available
      const defaultAddress = userAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        setAddress(defaultAddress.street);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load saved addresses.');
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: requestLocationPermission }
        ]
      );
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const addressDetails = geocode[0];
        setCurrentAddress({
          ...currentAddress,
          street: addressDetails.street || addressDetails.name || '',
          city: addressDetails.city || addressDetails.region || '',
          state: addressDetails.region || '',
          postalCode: addressDetails.postalCode || '',
          country: 'Kenya'
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please enter address manually.');
    }
  };

  const handleSaveAddress = async () => {
    if (!currentAddress.street || !currentAddress.city) {
      Alert.alert('Missing Information', 'Please fill in at least street and city.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save addresses.');
        return;
      }

      if (isEditMode) {
        await updateUserAddress(currentAddress);
      } else {
        await addUserAddress(currentAddress);
      }

      await loadAddresses();
      setShowAddressModal(false);
      Alert.alert('Success', `Address ${isEditMode ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} address.`);
    }
  };

  const renderAddressItem = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressItem,
        selectedAddress?.id === address.id && styles.selectedAddressItem
      ]}
      onPress={() => {
        setSelectedAddress(address);
        setAddress(address.street);
      }}
    >
      <View style={styles.addressHeader}>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressLine}>{address.street}</Text>
      <Text style={styles.addressLine}>
        {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}
      </Text>
      <Text style={styles.addressLine}>{address.country}</Text>
    </TouchableOpacity>
  );

  const renderAddressModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAddressModal}
      onRequestClose={() => setShowAddressModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {!isEditMode && (
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </TouchableOpacity>
          )}

          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Street Address*</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.street}
              onChangeText={(text) => setCurrentAddress({ ...currentAddress, street: text })}
              placeholder="Enter your street address"
              placeholderTextColor={theme.colors.textLight}
            />

            <Text style={styles.inputLabel}>City*</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.city}
              onChangeText={(text) => setCurrentAddress({ ...currentAddress, city: text })}
              placeholder="Enter your city"
              placeholderTextColor={theme.colors.textLight}
            />

            <Text style={styles.inputLabel}>State/Province</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.state}
              onChangeText={(text) => setCurrentAddress({ ...currentAddress, state: text })}
              placeholder="Enter your state or province"
              placeholderTextColor={theme.colors.textLight}
            />

            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={currentAddress.postalCode}
              onChangeText={(text) => setCurrentAddress({ ...currentAddress, postalCode: text })}
              placeholder="Enter your postal code"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledInputText}>Kenya</Text>
            </View>

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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedMonth, selectedYear) },
    (_, i) => i + 1
  );

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const amPm = ['AM', 'PM'];

  const confirmDateSelection = () => {
    const newDate = new Date(date);
    newDate.setFullYear(selectedYear);
    newDate.setMonth(selectedMonth);
    newDate.setDate(selectedDay);
    setDate(newDate);
    setShowDateModal(false);
  };

  const confirmTimeSelection = () => {
    const newDate = new Date(date);
    let hour = selectedHour;

    // Convert 12-hour format to 24-hour format
    if (selectedAmPm === 'PM' && selectedHour !== 12) {
      hour = selectedHour + 12;
    } else if (selectedAmPm === 'AM' && selectedHour === 12) {
      hour = 0;
    }

    newDate.setHours(hour);
    newDate.setMinutes(selectedMinute);
    setDate(newDate);
    setShowTimeModal(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString(undefined, options);
  };

  const handleBooking = () => {
    if (!address.trim()) {
      alert('Please enter your address');
      return;
    }

    router.push({
      pathname: "/bookingSummary",
      params: {
        tasker: JSON.stringify(tasker),
        date: date.toISOString(),
        address,
        notes,
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={50} color={theme.colors.primary} />
        <View style={styles.taskerInfo}>
          <Text style={styles.name}>{tasker.name}</Text>
          <Text style={styles.detail}>{tasker.category}</Text>
          <Text style={styles.detail}>{tasker.price}</Text>
        </View>
      </View>

      {/* Date & Time Selection */}
      <View style={styles.dateTimeSection}>
        <Text style={styles.sectionTitle}>Schedule Service</Text>

        <TouchableOpacity
          onPress={() => setShowDateModal(true)}
          style={styles.dateTimeBox}
        >
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateTimeLabel}>Date</Text>
            <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowTimeModal(true)}
          style={styles.dateTimeBox}
        >
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateTimeLabel}>Time</Text>
            <Text style={styles.dateTimeValue}>{formatTime(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.addressSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Address</Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => {
              setCurrentAddress({
                id: Date.now().toString(),
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'Kenya',
                isDefault: addresses.length === 0
              });
              setIsEditMode(false);
              setShowAddressModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.addAddressText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {addresses.length > 0 ? (
          <View style={styles.addressesList}>
            {addresses.map(address => renderAddressItem(address))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyAddressButton}
            onPress={() => {
              setCurrentAddress({
                id: Date.now().toString(),
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'Kenya',
                isDefault: true
              });
              setIsEditMode(false);
              setShowAddressModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.emptyAddressText}>Add your first address</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Or enter address manually</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
          placeholderTextColor={theme.colors.textLight}
        />
      </View>

      <Text style={styles.label}>Additional Notes</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any specific instructions"
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>Continue to Summary</Text>
      </TouchableOpacity>

      {/* Custom Date Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalHeaderButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={confirmDateSelection}>
                <Text style={styles.modalHeaderButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={months}
                  initialScrollIndex={selectedMonth}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, index === selectedMonth && styles.selectedPickerItem]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          index === selectedMonth && styles.selectedPickerItemText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={days}
                  initialScrollIndex={selectedDay - 1}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, item === selectedDay && styles.selectedPickerItem]}
                      onPress={() => setSelectedDay(item)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          item === selectedDay && styles.selectedPickerItemText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={years}
                  initialScrollIndex={years.indexOf(selectedYear)}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, item === selectedYear && styles.selectedPickerItem]}
                      onPress={() => setSelectedYear(item)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          item === selectedYear && styles.selectedPickerItemText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Time Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalHeaderButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={confirmTimeSelection}>
                <Text style={styles.modalHeaderButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={hours}
                  initialScrollIndex={hours.indexOf(selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour)}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item }) => {
                    const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
                    const isSelected = item === displayHour;

                    return (
                      <TouchableOpacity
                        style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
                        onPress={() => {
                          if (selectedAmPm === 'PM' && item !== 12) {
                            setSelectedHour(item + 12);
                          } else if (selectedAmPm === 'AM' && item === 12) {
                            setSelectedHour(0);
                          } else {
                            setSelectedHour(item);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            isSelected && styles.selectedPickerItemText
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={minutes}
                  initialScrollIndex={Math.floor(selectedMinute / 5)}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, item === selectedMinute && styles.selectedPickerItem]}
                      onPress={() => setSelectedMinute(item)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          item === selectedMinute && styles.selectedPickerItemText
                        ]}
                      >
                        {item.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* AM/PM Picker */}
              <View style={styles.pickerColumn}>
                <FlatList
                  data={amPm}
                  initialScrollIndex={amPm.indexOf(selectedAmPm)}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, item === selectedAmPm && styles.selectedPickerItem]}
                      onPress={() => {
                        setSelectedAmPm(item);
                        // Adjust hours when AM/PM changes
                        if (item === 'PM' && selectedHour < 12) {
                          setSelectedHour(selectedHour + 12);
                        } else if (item === 'AM' && selectedHour >= 12) {
                          setSelectedHour(selectedHour - 12);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          item === selectedAmPm && styles.selectedPickerItemText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {renderAddressModal()}
    </ScrollView>
  );
};

const createStyles = createThemedStyles(theme => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
    padding: 15,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#f9f9f9',
    borderRadius: 10,
  },
  taskerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  detail: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#f8f9fd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#eee',
    marginBottom: 15,
  },
  dateTimeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  label: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#fafafa',
    color: theme.colors.text,
  },
  button: {
    marginTop: 15,
    marginBottom: 30,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalHeaderButton: {
    fontSize: 17,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    height: 200,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: theme.dark ? 'rgba(74, 128, 240, 0.1)' : '#f0f5ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedPickerItemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  addressSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressText: {
    color: theme.colors.primary,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  addressesList: {
    marginBottom: 15,
  },
  addressItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedAddressItem: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  defaultBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  addressLine: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  emptyAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyAddressText: {
    color: theme.colors.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalForm: {
    maxHeight: '80%',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
  },
  disabledInputText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
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
}));

export default BookingScreen;