import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Import Firebase (adjust path as needed for your project structure)
import { getAuth } from 'firebase/auth'; // For getting the current user
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // For Firestore database operations
import { app } from '../../firebase-config'; // Assuming you have your Firebase app initialized in firebaseConfig.ts/js

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Define the types for data passed between onboarding screens (re-used from previous files)
type PersonalDetails = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

type IDVerificationFormData = {
    kraPin: string;
    idNumber: string;
    idFrontImage: string | null;
    idBackImage: string | null;
    idFrontImageBase64: string;
    idBackImageBase64: string;
};

type AreasServedFormData = {
    areasServed: string[];
};

type Service = {
    id: string;
    category: string;
    title: string;
    rate: string;
    description: string;
    isCustom?: boolean;
};

type ServicesData = {
    services: Service[];
};

type SupportingDocument = {
    id: string;
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    base64: string;
};

// New type for data collected specifically on this Profile screen
type ProfileFormData = {
    profileImageBase64: string | null;
    bio: string;
};

// This type represents ALL data collected across ALL onboarding screens
type AllOnboardingData = PersonalDetails & IDVerificationFormData & AreasServedFormData & ServicesData & {
    supportingDocuments: SupportingDocument[];
    profileImageBase64: string | null; // Add profile image Base64
    bio: string; // Add bio
    onboardingStatus: 'pendingVerification' | 'completed';
    submissionDate?: string;
};


export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Reconstruct the full onboardingData object from previous steps
    const receivedOnboardingData: Partial<AllOnboardingData> = params.onboardingData
        ? JSON.parse(params.onboardingData as string)
        : {};

    const [profileImageUri, setProfileImageUri] = useState<string | null>(null); // For display
    const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null); // For submission
    const [bio, setBio] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState(false); // For image picking loading
    const [isSaving, setIsSaving] = useState(false); // For database saving loading

    useEffect(() => {
        if (!receivedOnboardingData || Object.keys(receivedOnboardingData).length === 0) {
            Alert.alert('Error', 'No onboarding data received. Please start from the beginning.', [
                { text: 'OK', onPress: () => router.replace('/tasker-onboarding/personal-details') }
            ]);
        }
    }, [receivedOnboardingData]);


    const pickImage = async () => {
        setIsProcessing(true);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Please grant access to your photo library to select a profile photo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedUri = result.assets[0].uri;
                setProfileImageUri(selectedUri);

                const base64 = await FileSystem.readAsStringAsync(selectedUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                setProfileImageBase64(base64);

                if (errors.image) {
                    setErrors(prev => {
                        const { image, ...rest } = prev;
                        return rest;
                    });
                }
            }
        } catch (error: any) {
            console.error("Error picking image:", error);
            Alert.alert('Error', `Failed to pick image: ${error.message || 'Unknown error'}.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!profileImageBase64) {
            newErrors.image = 'Profile photo is required';
        }

        if (!bio.trim()) {
            newErrors.bio = 'Bio is required';
        } else if (bio.length < 50) {
            newErrors.bio = `Bio should be at least 50 characters (currently ${bio.length})`;
        } else if (bio.length > 200) {
            newErrors.bio = `Bio should be at most 200 characters (currently ${bio.length})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleComplete = async () => {
        if (validateForm()) {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert("Authentication Error", "You must be logged in to complete your profile.");
                router.replace('/login'); // Redirect to login or appropriate screen
                return;
            }

            setIsSaving(true); // Start saving indicator

            const finalOnboardingData: AllOnboardingData = {
                ...receivedOnboardingData as AllOnboardingData,
                profileImageBase64: profileImageBase64,
                bio: bio.trim(),
                onboardingStatus: 'completed', // Set status to completed upon successful profile creation
                submissionDate: new Date().toISOString(),
            };

            try {
                // Save all collected data to Firestore
                // The document ID will be the user's UID
                await setDoc(doc(db, 'taskers', currentUser.uid), finalOnboardingData);

                console.log("--------------------------------------------------");
                console.log("TASKER PROFILE SAVED TO FIRESTORE (truncated Base64 for log):");
                const dataToLog = { ...finalOnboardingData };
                if (dataToLog.profileImageBase64) {
                    dataToLog.profileImageBase64 = dataToLog.profileImageBase64.substring(0, 50) + "...[TRUNCATED]";
                }
                if (dataToLog.idFrontImageBase64) {
                    dataToLog.idFrontImageBase64 = dataToLog.idFrontImageBase64.substring(0, 50) + "...[TRUNCATED]";
                }
                if (dataToLog.idBackImageBase64) {
                    dataToLog.idBackImageBase64 = dataToLog.idBackImageBase64.substring(0, 50) + "...[TRUNCATED]";
                }
                if (dataToLog.supportingDocuments) {
                    dataToLog.supportingDocuments = dataToLog.supportingDocuments.map(doc => ({
                        ...doc,
                        base64: doc.base64.substring(0, 50) + "...[TRUNCATED]"
                    }));
                }
                console.log(JSON.stringify(dataToLog, null, 2));
                console.log("Document ID:", currentUser.uid);
                console.log("--------------------------------------------------");


                Alert.alert(
                    'Profile Complete',
                    'Your tasker profile has been created and submitted successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/tasker-dashboard'),
                        },
                    ]
                );

            } catch (error: any) {
                console.error("Error saving profile data to Firestore:", error);
                Alert.alert(
                    'Save Error',
                    `Failed to save your profile: ${error.message || 'Please check your internet connection and try again.'}`
                );
            } finally {
                setIsSaving(false); // Stop saving indicator
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Setup</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Add a profile photo and bio to help clients get to know you better.
                </Text>

                <View style={styles.photoSection}>
                    <TouchableOpacity
                        style={[styles.photoUpload, errors.image && styles.photoUploadError]}
                        onPress={pickImage}
                        disabled={isProcessing || isSaving}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="large" color="#4A80F0" />
                        ) : profileImageUri ? (
                            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={40} color="#666" />
                                <Text style={styles.photoUploadText}>Add Profile Photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {errors.image && (
                        <Text style={styles.errorText}>{errors.image}</Text>
                    )}
                </View>

                <View style={styles.bioSection}>
                    <Text style={styles.label}>Professional Bio</Text>
                    <Text style={styles.sublabel}>
                        Tell clients about your experience, skills, and what makes you great at what you do.
                    </Text>
                    <TextInput
                        style={[styles.bioInput, errors.bio && styles.inputError]}
                        value={bio}
                        onChangeText={(text) => {
                            setBio(text);
                            if (errors.bio && text.trim().length >= 50 && text.trim().length <= 200) {
                                setErrors(prev => {
                                    const { bio, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        placeholder="Write your bio here..."
                        multiline
                        textAlignVertical="top"
                        maxLength={200}
                        editable={!isSaving}
                    />
                    <Text style={styles.charCount}>
                        {bio.length}/200 characters (minimum 50)
                    </Text>
                    {errors.bio && (
                        <Text style={styles.errorText}>{errors.bio}</Text>
                    )}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleComplete} disabled={isProcessing || isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Complete Profile</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
    photoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    photoUpload: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#f8f9fd',
        borderWidth: 2,
        borderColor: '#eee',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoUploadError: {
        borderColor: '#ff4444',
    },
    photoUploadText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bioSection: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    sublabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    bioInput: {
        height: 200,
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
    charCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        textAlign: 'right',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
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