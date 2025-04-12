import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
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
  const [showPicker, setShowPicker] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const onChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };
  

  const handleBooking = () => {
    navigation.navigate('BookingSummary', {
      tasker,
      date,
      address,
      notes,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={50} color="#4A80F0" />
        <View>
          <Text style={styles.name}>{tasker.name}</Text>
          <Text style={styles.detail}>{tasker.category}</Text>
          <Text style={styles.detail}>{tasker.price}</Text>
        </View>
      </View>

      <Text style={styles.label}>Date & Time</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.inputBox}>
        <Text>{date.toLocaleString()}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={onChange}
        />
      )}

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
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detail: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  button: {
    marginTop: 30,
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
});

export default BookingScreen;
