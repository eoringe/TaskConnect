import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Booking: { tasker: any }; // Replace `any` with a defined Tasker type if available
  BookingSummary: {
    tasker: any;
    date: Date;
    address: string;
    notes: string;
  };
};

type BookingScreenRouteProp = RouteProp<RootStackParamList, 'Booking'>;
type BookingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Booking'>;

type Props = {
  route: BookingScreenRouteProp;
  navigation: BookingScreenNavigationProp;
};

const BookingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tasker } = route.params;

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
    
    navigation.navigate('BookingSummary', {
      tasker,
      date,
      address,
      notes,
    });
  };

  const renderPickerItem = (item: number | string, isSelected: boolean) => (
    <TouchableOpacity
      style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
    >
      <Text style={[styles.pickerItemText, isSelected && styles.selectedPickerItemText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={50} color="#4A80F0" />
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
          <Ionicons name="calendar-outline" size={24} color="#4A80F0" />
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateTimeLabel}>Date</Text>
            <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setShowTimeModal(true)}
          style={styles.dateTimeBox}
        >
          <Ionicons name="time-outline" size={24} color="#4A80F0" />
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateTimeLabel}>Time</Text>
            <Text style={styles.dateTimeValue}>{formatTime(date)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter your address"
      />

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  taskerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dateTimeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  dateTimeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  label: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 15,
    marginBottom: 30,
    backgroundColor: '#4A80F0',
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
    backgroundColor: 'white',
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  modalHeaderButton: {
    fontSize: 17,
    color: '#4A80F0',
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
    backgroundColor: '#f0f5ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPickerItemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A80F0',
  },
});

export default BookingScreen;