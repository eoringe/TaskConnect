import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            if (errors.image) {
                setErrors(prev => {
                    const { image, ...rest } = prev;
                    return rest;
                });
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!profileImage) {
            newErrors.image = 'Profile photo is required';
        }

        if (!bio.trim()) {
            newErrors.bio = 'Bio is required';
        } else if (bio.length < 50) {
            newErrors.bio = 'Bio should be at least 50 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleComplete = () => {
        if (validateForm()) {
            // Here you would typically submit all the collected data to your backend
            Alert.alert(
                'Profile Complete',
                'Your tasker profile has been created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/tasker-dashboard'),
                    },
                ]
            );
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
                    >
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
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
                            if (text.trim()) {
                                setErrors(prev => {
                                    const { bio, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        placeholder="Write your bio here..."
                        multiline
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>
                        {bio.length}/200 characters (minimum 50)
                    </Text>
                    {errors.bio && (
                        <Text style={styles.errorText}>{errors.bio}</Text>
                    )}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleComplete}>
                    <Text style={styles.buttonText}>Complete Profile</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
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