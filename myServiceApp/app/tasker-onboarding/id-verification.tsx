import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type FormData = {
    kraPin: string;
    idNumber: string;
    idFrontImage: string | null;
    idBackImage: string | null;
};

export default function IDVerificationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const personalDetails = params.personalDetails ? JSON.parse(params.personalDetails as string) : null;

    const [formData, setFormData] = useState<FormData>({
        kraPin: '',
        idNumber: '',
        idFrontImage: null,
        idBackImage: null,
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    const pickImage = async (side: 'front' | 'back') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.8,
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
        const newErrors: Partial<FormData> = {};

        if (!formData.kraPin.trim()) {
            newErrors.kraPin = 'KRA PIN is required';
        } else if (!/^[A-Z]\d{9}[A-Z]$/.test(formData.kraPin)) {
            newErrors.kraPin = 'Please enter a valid KRA PIN';
        }

        if (!formData.idNumber.trim()) {
            newErrors.idNumber = 'ID Number is required';
        } else if (!/^\d{8}$/.test(formData.idNumber)) {
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

    const handleNext = () => {
        if (validateForm()) {
            router.push({
                pathname: '/tasker-onboarding/areas-served',
                params: {
                    personalDetails: params.personalDetails,
                    idVerification: JSON.stringify(formData),
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
                <Text style={styles.headerTitle}>ID Verification</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    To ensure the safety and trust of our community, we need to verify your identity.
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
                            placeholder="Enter your KRA PIN"
                            autoCapitalize="characters"
                            maxLength={11}
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
                            placeholder="Enter your ID number"
                            keyboardType="number-pad"
                            maxLength={8}
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