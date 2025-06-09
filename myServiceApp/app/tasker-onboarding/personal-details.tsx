import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Import setDoc
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
    const [isSaving, setIsSaving] = useState(false); // New state for saving data

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
                        }));
                    } else {
                        Alert.alert('Error', 'User data not found in Firestore.');
                    }
                } else {
                    Alert.alert('Error', 'No authenticated user found.');
                    // Optionally, redirect to login if no user is found
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

        setIsSaving(true); // Start saving
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Authentication Error', 'No authenticated user found. Please log in again.');
                router.replace('/login');
                return;
            }

            const db = getFirestore();
            const taskerDocRef = doc(db, 'taskers', user.uid); // Reference to the tasker document using UID

            // Data to save to the 'taskers' collection
            const taskerData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                // Do not save email and phone here, as they are in the 'users' collection
            };

            await setDoc(taskerDocRef, taskerData, { merge: true }); // Use setDoc with merge: true to avoid overwriting existing fields

            Alert.alert('Success', 'Personal details saved successfully!');

            // Proceed to the next screen, passing the relevant personal details
            router.push({
                pathname: '/tasker-onboarding/id-verification',
                params: { personalDetails: JSON.stringify(formData) }
            });

        } catch (error) {
            console.error("Error saving personal details to taskers collection:", error);
            Alert.alert('Error', 'Failed to save personal details. Please try again.');
        } finally {
            setIsSaving(false); // End saving
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isSaving}>
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
                            editable={!isSaving} // Disable input while saving
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
                            editable={!isSaving} // Disable input while saving
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
                    disabled={isSaving} // Disable button while saving
                >
                    {isSaving ? (
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