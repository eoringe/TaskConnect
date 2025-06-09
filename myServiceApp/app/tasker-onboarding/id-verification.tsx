import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FirebaseError } from '@firebase/util';

// Define the type for PersonalDetails that we expect from params
type PersonalDetails = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

// Define the type for the ID Verification form data
type IDVerificationFormData = {
    kraPin: string;
    idNumber: string;
    idFrontImage: string | null; // URI of the local image
    idBackImage: string | null;  // URI of the local image
};

export default function IDVerificationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse the personalDetails from the params
    const personalDetails: PersonalDetails | null = params.personalDetails
        ? JSON.parse(params.personalDetails as string)
        : null;

    const [formData, setFormData] = useState<IDVerificationFormData>({
        kraPin: '',
        idNumber: '',
        idFrontImage: null,
        idBackImage: null,
    });

    const [errors, setErrors] = useState<Partial<IDVerificationFormData>>({});
    const [isSaving, setIsSaving] = useState(false);

    // If personalDetails are missing, log an error or redirect
    if (!personalDetails) {
        console.error("Personal details not found in params. Redirecting back.");
        // Consider a more robust error handling or redirect, e.g., router.replace('/tasker-onboarding/personal-details');
    }

    const pickImage = async (side: 'front' | 'back') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please grant access to your photo library to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.5, // Reduced quality to help keep Base64 size down
            base64: false, // We'll convert to Base64 manually after getting the URI
        });

        if (!result.canceled) {
            setFormData(prev => ({
                ...prev,
                [side === 'front' ? 'idFrontImage' : 'idBackImage']: result.assets[0].uri,
            }));
            setErrors(prev => ({
                ...prev,
                [side === 'front' ? 'idFrontImage' : 'idBackImage']: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<IDVerificationFormData> = {};

        if (!formData.kraPin.trim()) {
            newErrors.kraPin = 'KRA PIN is required';
        } else if (!/^[A-Z]\d{9}[A-Z]$/.test(formData.kraPin.trim())) {
            newErrors.kraPin = 'Please enter a valid KRA PIN (e.g., A123456789Z)';
        }

        if (!formData.idNumber.trim()) {
            newErrors.idNumber = 'ID Number is required';
        } else if (!/^\d{8}$/.test(formData.idNumber.trim())) {
            newErrors.idNumber = 'Please enter a valid 8-digit ID number';
        }

        if (!formData.idFrontImage) {
            newErrors.idFrontImage = 'Front image of ID is required';
        }

        if (!formData.idBackImage) {
            newErrors.idBackImage = 'Back image of ID is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const convertImageToBase64 = async (uri: string, side: 'front' | 'back'): Promise<string> => {
        console.log(`[BASE64 CONVERSION] Attempting to convert image URI to Base64 for ${side} side.`);
        try {
            const response = await fetch(uri);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[BASE64 CONVERSION ERROR] Failed to fetch image (HTTP Status: ${response.status}, Text: ${errorText})`);
                throw new Error(`Failed to fetch image from local URI: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error("FileReader did not return a valid Base64 string."));
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(blob);
            });

            console.log(`[BASE64 CONVERSION] Image converted to Base64 successfully for ${side} side. Length: ${base64.length} characters.`);
            // console.log(`[BASE64 CONVERSION] Snippet: ${base64.substring(0, 50)}...`); // Log snippet if needed
            return base64;

        } catch (error: any) {
            console.error(`[BASE64 CONVERSION ERROR] Error during Base64 conversion for ${side} side:`, error);
            throw error;
        }
    };

    const handleNext = async () => {
        if (!validateForm()) {
            return;
        }

        if (!personalDetails) {
            Alert.alert('Error', 'Personal details are missing. Please go back and fill them.');
            router.replace('/tasker-onboarding/personal-details'); // Redirect back if personal details are missing
            return;
        }

        setIsSaving(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Authentication Error', 'No authenticated user found. Please log in again.');
                router.replace('/login');
                return;
            }

            console.log(`[FIRESTORE SAVE] Current User UID: ${user.uid}`);

            if (!formData.idFrontImage) {
                throw new Error("Front ID image is missing.");
            }
            if (!formData.idBackImage) {
                throw new Error("Back ID image is missing.");
            }

            // Convert images to Base64 strings
            const frontImageBase64 = await convertImageToBase64(formData.idFrontImage!, 'front');
            const backImageBase64 = await convertImageToBase64(formData.idBackImage!, 'back');

            const db = getFirestore();
            const taskerDocRef = doc(db, 'taskers', user.uid);

            // Combine all collected data into a single object for Firestore
            const combinedTaskerData = {
                // Personal Details (from previous screen)
                firstName: personalDetails.firstName,
                lastName: personalDetails.lastName,
                email: personalDetails.email, // Email from Firebase Auth/Users collection
                phone: personalDetails.phone, // Phone from Firebase Auth/Users collection

                // ID Verification Details (from current screen)
                kraPin: formData.kraPin.trim(),
                idNumber: formData.idNumber.trim(),
                idFrontImageBase64: frontImageBase64,
                idBackImageBase64: backImageBase64,
                verificationStatus: false, // Initial status
                submissionDate: new Date(),
                onboardingStep: 'idVerificationCompleted', // Mark this step as completed
            };

            console.log("[FIRESTORE SAVE] Data being prepared for saving to 'taskers' collection:");
            console.log(JSON.stringify(combinedTaskerData, null, 2)); // Log the entire object for inspection

            // Save all details to Firestore in a single operation
            await setDoc(taskerDocRef, combinedTaskerData, { merge: true });
            console.log('[FIRESTORE SAVE] All tasker onboarding data (personal + ID) saved to Firestore successfully.');

            Alert.alert('Success', 'Your details have been saved successfully!');

            // Proceed to the next screen, passing relevant data if needed for subsequent steps
            router.push({
                pathname: '/tasker-onboarding/areas-served',
                params: {
                    // You might want to pass minimal info or a status,
                    // as the full data is now in Firestore
                    onboardingCompletedStep: 'idVerification'
                },
            });

        } catch (error: any) {
            console.error("Error saving all onboarding details in IDVerificationScreen:", error);
            let errorMessage = 'An unknown error occurred during saving. Please try again.';

            if (error instanceof FirebaseError) {
                errorMessage = `Firebase Error: ${error.code} - ${error.message}`;
            } else if (error instanceof Error) {
                errorMessage = `App Error: ${error.message}`;
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isSaving}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ID Verification</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    To ensure the safety and trust of our community, we need to verify your identity.
                    Please provide your KRA PIN, ID number, and upload clear images of your ID card.
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>KRA PIN</Text>
                        <TextInput
                            style={[styles.input, errors.kraPin && styles.inputError]}
                            value={formData.kraPin}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, kraPin: text.toUpperCase() }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, kraPin: undefined }));
                                }
                            }}
                            placeholder="Enter your KRA PIN (e.g., A123456789Z)"
                            autoCapitalize="characters"
                            maxLength={11}
                            editable={!isSaving}
                        />
                        {errors.kraPin && (
                            <Text style={styles.errorText}>{errors.kraPin}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Number</Text>
                        <TextInput
                            style={[styles.input, errors.idNumber && styles.inputError]}
                            value={formData.idNumber}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, idNumber: text }));
                                if (text.trim()) {
                                    setErrors(prev => ({ ...prev, idNumber: undefined }));
                                }
                            }}
                            placeholder="Enter your ID number (e.g., 12345678)"
                            keyboardType="number-pad"
                            maxLength={8}
                            editable={!isSaving}
                        />
                        {errors.idNumber && (
                            <Text style={styles.errorText}>{errors.idNumber}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Card Images</Text>
                        <Text style={styles.sublabel}>Upload clear photos of both sides of your ID</Text>

                        <View style={styles.idImagesContainer}>
                            <TouchableOpacity
                                style={[styles.imageUploadBox, errors.idFrontImage && styles.imageUploadError]}
                                onPress={() => pickImage('front')}
                                disabled={isSaving}
                            >
                                {formData.idFrontImage ? (
                                    <Image
                                        source={{ uri: formData.idFrontImage }}
                                        style={styles.uploadedImage}
                                    />
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={32} color="#666" />
                                        <Text style={styles.uploadText}>Front Side</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.imageUploadBox, errors.idBackImage && styles.imageUploadError]}
                                onPress={() => pickImage('back')}
                                disabled={isSaving}
                            >
                                {formData.idBackImage ? (
                                    <Image
                                        source={{ uri: formData.idBackImage }}
                                        style={styles.uploadedImage}
                                    />
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={32} color="#666" />
                                        <Text style={styles.uploadText}>Back Side</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        {(errors.idFrontImage || errors.idBackImage) && (
                            <Text style={styles.errorText}>Both sides of ID are required</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    disabled={isSaving}
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
    sublabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
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
    idImagesContainer: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10,
    },
    imageUploadBox: {
        flex: 1,
        aspectRatio: 3 / 2,
        borderWidth: 2,
        borderColor: '#eee',
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fd',
        overflow: 'hidden',
    },
    imageUploadError: {
        borderColor: '#ff4444',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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