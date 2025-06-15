import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Removed setDoc import as we won't save here
import { getAuth } from 'firebase/auth'; // Import Auth functions

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
    const [loading, setLoading] = useState(true); // State to manage loading indicator
    const [isProcessing, setIsProcessing] = useState(false); // Renamed from isSaving, as we're not saving here yet

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                    const db = getFirestore();
                    const userDocRef = doc(db, 'users', user.uid); // Assuming 'users' collection and UID as document ID
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setFormData(prev => ({
                            ...prev,
                            email: userData.email || '', // Prefill email
                            phone: userData.phoneNumber || '', // Prefill phone number
                            // Do not prefill firstName and lastName from 'users' if they are meant to be entered specifically for 'taskers'
                            // If they are in 'users' and you want to prefill, add:
                            // firstName: userData.firstName || '',
                            // lastName: userData.lastName || '',
                        }));
                    } else {
                        // This case means a user exists in auth but not in your 'users' Firestore collection.
                        // For a real app, you might want to handle this as an error or prompt for full user registration.
                        // For this flow, we'll proceed with empty firstName/lastName and prefill email/phone if available from auth.
                        console.warn("User data not found in 'users' collection for UID:", user.uid);
                        setFormData(prev => ({
                            ...prev,
                            email: user.email || '', // Fallback to auth email if Firestore user doc missing
                            phone: user.phoneNumber || '', // Fallback to auth phone if Firestore user doc missing
                        }));
                    }
                } else {
                    Alert.alert('Authentication Error', 'No authenticated user found. Please log in again.');
                    router.replace('/login');
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                Alert.alert('Error', 'Failed to fetch user details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, []); // Empty dependency array means this effect runs once after the initial render

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validateForm()) {
            return;
        }

        setIsProcessing(true); // Indicate that we're processing (e.g., navigating)
        try {
            // No saving to Firestore here. Just collect data and pass it.

            // The formData now contains firstName, lastName, pre-filled email, and phone.
            // Pass all of this to the next screen.
            router.push({
                pathname: '/tasker-onboarding/id-verification',
                params: { personalDetails: JSON.stringify(formData) } // Pass the entire formData object
            });

        } catch (error) {
            console.error("Error during navigation or data preparation for ID verification:", error);
            Alert.alert('Error', 'Failed to proceed. Please try again.');
        } finally {
            setIsProcessing(false); // End processing
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A80F0" />
                <Text style={styles.loadingText}>Loading personal details...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isProcessing}>
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
                            editable={!isProcessing} // Disable input while processing
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
                            editable={!isProcessing} // Disable input while processing
                        />
                        {errors.lastName && (
                            <Text style={styles.errorText}>{errors.lastName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.uneditableInput]}
                            value={formData.email}
                            editable={false} // Make it uneditable
                            placeholder="Email will be prefilled"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, styles.uneditableInput]}
                            value={formData.phone}
                            editable={false} // Make it uneditable
                            placeholder="Phone number will be prefilled"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    disabled={isProcessing} // Disable button while processing
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
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
    uneditableInput: {
        backgroundColor: '#e9e9e9',
        color: '#888',
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