import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

export default function PersonalDetailsScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            // Store the data and proceed to next screen
            router.push({
                pathname: '/tasker-onboarding/id-verification',
                params: { personalDetails: JSON.stringify(formData) }
            });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Details</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Let's start with your basic information. This will be used to create your tasker profile.
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={[styles.input, errors.firstName && styles.inputError]}
                            value={formData.firstName}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, firstName: text }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, firstName: undefined }));
                                }
                            }}
                            placeholder="Enter your first name"
                        />
                        {errors.firstName && (
                            <Text style={styles.errorText}>{errors.firstName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={[styles.input, errors.lastName && styles.inputError]}
                            value={formData.lastName}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, lastName: text }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, lastName: undefined }));
                                }
                            }}
                            placeholder="Enter your last name"
                        />
                        {errors.lastName && (
                            <Text style={styles.errorText}>{errors.lastName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            value={formData.email}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, email: text }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, email: undefined }));
                                }
                            }}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, errors.phone && styles.inputError]}
                            value={formData.phone}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, phone: text }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, phone: undefined }));
                                }
                            }}
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                        />
                        {errors.phone && (
                            <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                    </View>
                </View>

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
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
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