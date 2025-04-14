import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type PaymentMethod = 'mpesa' | 'cash' | 'card';

type MpesaDetails = {
    phoneNumber: string;
    name: string;
};

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
    const [mpesaDetails, setMpesaDetails] = useState<MpesaDetails>({
        phoneNumber: '',
        name: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const paymentMethods = [
        { id: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait-outline' },
        { id: 'cash', label: 'Cash', icon: 'cash-outline' },
        { id: 'card', label: 'Card', icon: 'card-outline' },
    ];

    const togglePaymentMethod = (method: PaymentMethod) => {
        setSelectedMethods(prev => {
            if (prev.includes(method)) {
                return prev.filter(m => m !== method);
            }
            return [...prev, method];
        });
        setErrors({});
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (selectedMethods.length === 0) {
            newErrors.methods = 'Please select at least one payment method';
        }

        if (selectedMethods.includes('mpesa')) {
            if (!mpesaDetails.phoneNumber.trim()) {
                newErrors.phoneNumber = 'Phone number is required for M-Pesa';
            } else if (!/^\d{10}$/.test(mpesaDetails.phoneNumber.replace(/[^0-9]/g, ''))) {
                newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
            }

            if (!mpesaDetails.name.trim()) {
                newErrors.name = 'Account name is required for M-Pesa';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            router.push({
                pathname: '/tasker-onboarding/profile',
                params: {
                    personalDetails: params.personalDetails,
                    idVerification: params.idVerification,
                    areasServed: params.areasServed,
                    services: params.services,
                    paymentMethods: JSON.stringify({
                        methods: selectedMethods,
                        mpesaDetails: selectedMethods.includes('mpesa') ? mpesaDetails : null,
                    }),
                },
            });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Select the payment methods you want to accept from clients.
                </Text>

                <View style={styles.methodsContainer}>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.methodButton,
                                selectedMethods.includes(method.id as PaymentMethod) && styles.methodButtonSelected,
                            ]}
                            onPress={() => togglePaymentMethod(method.id as PaymentMethod)}
                        >
                            <Ionicons
                                name={method.icon as any}
                                size={24}
                                color={selectedMethods.includes(method.id as PaymentMethod) ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.methodButtonText,
                                selectedMethods.includes(method.id as PaymentMethod) && styles.methodButtonTextSelected,
                            ]}>
                                {method.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {errors.methods && (
                    <Text style={styles.errorText}>{errors.methods}</Text>
                )}

                {selectedMethods.includes('mpesa') && (
                    <View style={styles.mpesaDetailsContainer}>
                        <Text style={styles.sectionTitle}>M-Pesa Details</Text>
                        <Text style={styles.subtitle}>
                            Enter the M-Pesa details where you want to receive payments.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, errors.phoneNumber && styles.inputError]}
                                value={mpesaDetails.phoneNumber}
                                onChangeText={(text) => {
                                    setMpesaDetails(prev => ({ ...prev, phoneNumber: text }));
                                    if (errors.phoneNumber) {
                                        setErrors(prev => ({ ...prev, phoneNumber: undefined }));
                                    }
                                }}
                                placeholder="Enter M-Pesa number"
                                keyboardType="phone-pad"
                            />
                            {errors.phoneNumber && (
                                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Account Name</Text>
                            <TextInput
                                style={[styles.input, errors.name && styles.inputError]}
                                value={mpesaDetails.name}
                                onChangeText={(text) => {
                                    setMpesaDetails(prev => ({ ...prev, name: text }));
                                    if (errors.name) {
                                        setErrors(prev => ({ ...prev, name: undefined }));
                                    }
                                }}
                                placeholder="Enter account name"
                            />
                            {errors.name && (
                                <Text style={styles.errorText}>{errors.name}</Text>
                            )}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
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
    content: {
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 30,
    },
    methodsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    methodButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#f8f9fd',
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        gap: 8,
    },
    methodButtonSelected: {
        backgroundColor: '#4A80F0',
        borderColor: '#4A80F0',
    },
    methodButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    methodButtonTextSelected: {
        color: '#fff',
    },
    mpesaDetailsContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f8f9fd',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#fff',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A80F0',
        padding: 18,
        borderRadius: 12,
        marginTop: 30,
        gap: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
}); 