import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SearchParamTypes, Tasker } from '../types/navigation';

type PaymentMethod = 'mpesa' | 'cash' | 'card';

export default function BookingScreen() {
    const params = useLocalSearchParams<SearchParamTypes['booking']>();
    const router = useRouter();
    const tasker = params.tasker ? JSON.parse(params.tasker) as Tasker : null;

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDateOnly, setSelectedDateOnly] = useState<Date | null>(null);
    const [selectedTimeOnly, setSelectedTimeOnly] = useState<Date | null>(null);
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [taskDuration, setTaskDuration] = useState('');
    const [errors, setErrors] = useState<{
        address?: string;
        date?: string;
        time?: string;
        payment?: string;
    }>({});

    const combineDateTime = (datePart: Date, timePart: Date): Date => {
        const combined = new Date(datePart);
        combined.setHours(timePart.getHours());
        combined.setMinutes(timePart.getMinutes());
        combined.setSeconds(0);
        combined.setMilliseconds(0);
        return combined;
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selected) {
            // Check if date is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selected < today) {
                setErrors(prev => ({ ...prev, date: 'Please select a future date' }));
                return;
            }

            setSelectedDateOnly(selected);
            setErrors(prev => ({ ...prev, date: undefined }));

            if (selectedTimeOnly) {
                const combined = combineDateTime(selected, selectedTimeOnly);
                setDate(combined);
            }
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (event.type === 'dismissed') {
            setShowTimePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (selected) {
            // Check if selected time is in the past for today's date
            if (selectedDateOnly) {
                const now = new Date();
                const combined = combineDateTime(selectedDateOnly, selected);

                if (selectedDateOnly.getDate() === now.getDate() &&
                    selectedDateOnly.getMonth() === now.getMonth() &&
                    selectedDateOnly.getFullYear() === now.getFullYear() &&
                    combined < now) {
                    setErrors(prev => ({ ...prev, time: 'Please select a future time for today' }));
                    return;
                }
            }

            setSelectedTimeOnly(selected);
            setErrors(prev => ({ ...prev, time: undefined }));

            if (selectedDateOnly) {
                const combined = combineDateTime(selectedDateOnly, selected);
                setDate(combined);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!selectedDateOnly) {
            newErrors.date = 'Please select a date';
        }

        if (!selectedTimeOnly) {
            newErrors.time = 'Please select a time';
        }

        if (!paymentMethod) {
            newErrors.payment = 'Please select a payment method';
        }

        if (date < new Date()) {
            newErrors.time = 'Please select a future date and time';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBooking = () => {
        if (!validateForm()) {
            Alert.alert('Error', 'Please fix the errors before continuing');
            return;
        }

        router.push({
            pathname: "/bookingSummary",
            params: {
                tasker: JSON.stringify(tasker),
                date: date.toISOString(),
                address,
                notes,
                taskDuration,
                paymentMethod,
            },
        });
    };

    if (!tasker) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: No tasker information provided</Text>
            </View>
        );
    }

    const renderDateTimePicker = () => {
        if (Platform.OS === 'android') {
            return (
                <>
                    {showDatePicker && (
                        <View style={styles.dateTimePicker}>
                            <DateTimePicker
                                value={selectedDateOnly || new Date()}
                                mode="date"
                                display="calendar"
                                onChange={onDateChange}
                                minimumDate={new Date()}
                            />
                        </View>
                    )}
                    {showTimePicker && (
                        <View style={styles.dateTimePicker}>
                            <DateTimePicker
                                value={selectedTimeOnly || new Date()}
                                mode="time"
                                display="clock"
                                onChange={onTimeChange}
                            />
                        </View>
                    )}
                </>
            );
        }

        return (
            <>
                <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.modalHeaderButton}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select Date</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedDateOnly) {
                                            setShowDatePicker(false);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.modalHeaderButton,
                                        !selectedDateOnly && styles.modalHeaderButtonDisabled
                                    ]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateTimePicker}>
                                <DateTimePicker
                                    value={selectedDateOnly || new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                    style={{ width: '100%', height: 300 }}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={showTimePicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowTimePicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                    <Text style={styles.modalHeaderButton}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select Time</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedTimeOnly) {
                                            setShowTimePicker(false);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.modalHeaderButton,
                                        !selectedTimeOnly && styles.modalHeaderButtonDisabled
                                    ]}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateTimePicker}>
                                <DateTimePicker
                                    value={selectedTimeOnly || new Date()}
                                    mode="time"
                                    display="spinner"
                                    onChange={onTimeChange}
                                    style={{ width: '100%' }}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            </>
        );
    };

    const renderPaymentMethods = () => {
        const methods: { id: PaymentMethod; label: string; icon: string }[] = [
            { id: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait-outline' },
            { id: 'cash', label: 'Cash', icon: 'cash-outline' },
            { id: 'card', label: 'Card', icon: 'card-outline' },
        ];

        return (
            <View style={styles.paymentMethodsContainer}>
                {methods.map((method) => (
                    <TouchableOpacity
                        key={method.id}
                        style={[
                            styles.paymentMethodBox,
                            paymentMethod === method.id && styles.paymentMethodSelected,
                        ]}
                        onPress={() => {
                            setPaymentMethod(method.id);
                            setErrors(prev => ({ ...prev, payment: undefined }));
                        }}
                    >
                        <Ionicons
                            name={method.icon as any}
                            size={24}
                            color={paymentMethod === method.id ? '#4A80F0' : '#666'}
                        />
                        <Text style={[
                            styles.paymentMethodText,
                            paymentMethod === method.id && styles.paymentMethodTextSelected,
                        ]}>
                            {method.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
            </View>

            <View style={styles.card}>
                <Ionicons name="person-circle-outline" size={50} color="#4A80F0" />
                <View style={styles.taskerInfo}>
                    <Text style={styles.name}>{tasker.name}</Text>
                    <Text style={styles.detail}>{tasker.category}</Text>
                    <Text style={styles.detail}>{tasker.price}</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>{tasker.rating}</Text>
                        <Text style={styles.reviewsText}>({tasker.reviews} reviews)</Text>
                    </View>
                </View>
            </View>

            <View style={styles.dateTimeSection}>
                <Text style={styles.sectionTitle}>Schedule Service</Text>

                <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={[styles.dateTimeBox, errors.date && styles.inputError]}
                    >
                        <Ionicons name="calendar-outline" size={24} color="#4A80F0" />
                        <View style={styles.dateTimeTextContainer}>
                            <Text style={styles.dateTimeLabel}>Date</Text>
                            <Text style={styles.dateTimeValue}>
                                {selectedDateOnly ? formatDate(selectedDateOnly) : 'Select Date'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                    {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

                    <TouchableOpacity
                        onPress={() => setShowTimePicker(true)}
                        style={[styles.dateTimeBox, errors.time && styles.inputError]}
                    >
                        <Ionicons name="time-outline" size={24} color="#4A80F0" />
                        <View style={styles.dateTimeTextContainer}>
                            <Text style={styles.dateTimeLabel}>Time</Text>
                            <Text style={styles.dateTimeValue}>
                                {selectedTimeOnly ? formatTime(selectedTimeOnly) : 'Select Time'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                    {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                </View>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Location Details</Text>

                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={[styles.input, errors.address && styles.inputError]}
                    value={address}
                    onChangeText={(text) => {
                        setAddress(text);
                        if (text.trim()) {
                            setErrors(prev => ({ ...prev, address: undefined }));
                        }
                    }}
                    placeholder="Enter your address"
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

                <Text style={styles.label}>Task Duration (optional)</Text>
                <TextInput
                    style={styles.input}
                    value={taskDuration}
                    onChangeText={setTaskDuration}
                    placeholder="e.g., 2-3 hours, half day, etc."
                />

                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any specific instructions or requirements"
                    multiline
                />
            </View>

            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                {renderPaymentMethods()}
                {errors.payment && <Text style={styles.errorText}>{errors.payment}</Text>}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleBooking}
            >
                <Text style={styles.buttonText}>Continue to Summary</Text>
            </TouchableOpacity>

            {renderDateTimePicker()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    taskerInfo: {
        marginLeft: 15,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    detail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginLeft: 4,
    },
    reviewsText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    dateTimeSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    formSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    dateTimeContainer: {
        gap: 15,
    },
    dateTimeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fd',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
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
        marginTop: 15,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#f8f9fd',
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 5,
    },
    button: {
        margin: 20,
        backgroundColor: '#4A80F0',
        padding: 18,
        borderRadius: 12,
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '80%',
        width: '100%',
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
    modalHeaderButtonDisabled: {
        opacity: 0.5,
    },
    dateTimePicker: {
        width: '100%',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateTimePickerText: {
        color: '#000',
    },
    paymentMethodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
    paymentMethodBox: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f8f9fd',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    paymentMethodSelected: {
        borderColor: '#4A80F0',
        backgroundColor: '#f0f5ff',
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    paymentMethodTextSelected: {
        color: '#4A80F0',
        fontWeight: '600',
    },
}); 