import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Define the types for data passed between onboarding screens
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

// This type represents ALL data collected up to the Services screen
type ServicesData = {
    services: Service[];
};

// Type for an individual uploaded supporting document
type SupportingDocument = {
    id: string;
    uri: string; // Local URI (for display)
    name: string; // User-provided name
    description: string; // User-provided description
    mimeType: string; // Add mimeType to distinguish PDFs from images
    base64: string; // Base64 string (for saving to Firestore)
};

// This type represents ALL data collected across ALL onboarding screens
type AllOnboardingData = PersonalDetails & IDVerificationFormData & AreasServedFormData & ServicesData & {
    supportingDocuments: SupportingDocument[];
    onboardingStatus: 'pendingVerification' | 'completed'; // Example status
    submissionDate?: string; // Optional ISO string for submission timestamp
};


export default function SupportingDocumentsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Reconstruct the full onboardingData object from previous steps
    const receivedOnboardingData: Partial<AllOnboardingData> = params.onboardingData
        ? JSON.parse(params.onboardingData as string)
        : {};

    const [uploadedDocuments, setUploadedDocuments] = useState<SupportingDocument[]>([]);
    const [currentDocument, setCurrentDocument] = useState<{
        uri: string | null;
        name: string;
        description: string;
        mimeType: string | null; // Track mimeType for current selection
    }>({ uri: null, name: '', description: '', mimeType: null });
    const [showDocumentForm, setShowDocumentForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Check if previous data was received
    useEffect(() => {
        if (!receivedOnboardingData.firstName || !receivedOnboardingData.services) {
            Alert.alert('Error', 'Previous onboarding data missing. Please restart the onboarding process.');
            router.replace('/tasker-onboarding/personal-details'); // Or your first onboarding screen
        }
    }, [receivedOnboardingData, router]);

    const pickDocument = async () => {
        setIsProcessing(true); // Indicate loading while picking
        try {
            // No need to request media permissions for DocumentPicker; it handles permissions internally.

            // Use DocumentPicker to allow selection of images and PDF files
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'], // Allow all image types and PDF
                copyToCacheDirectory: true, // Crucial for getting a stable URI and reading Base64
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                let base64String = null;

                // DocumentPicker.getDocumentAsync doesn't always provide base64 directly for all types reliably.
                // It's safer to read it manually from the URI if not provided.
                if (selectedAsset.uri) {
                    base64String = await FileSystem.readAsStringAsync(selectedAsset.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                }


                if (selectedAsset.uri && base64String) {
                    setCurrentDocument(prev => ({
                        ...prev,
                        uri: selectedAsset.uri,
                        mimeType: selectedAsset.mimeType || 'application/octet-stream', // Default if mimeType is null
                    }));
                    setShowDocumentForm(true); // Show the form to add details
                    setErrors({}); // Clear previous errors
                } else {
                    Alert.alert('Error', 'Could not get file URI or convert to Base64.');
                }
            }
        } catch (error: any) {
            console.error("Document picking error:", error);
            Alert.alert('Error picking document', `Failed to pick document: ${error.message || 'Unknown error'}.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddDocument = async () => {
        const newErrors: {[key: string]: string} = {};

        if (!currentDocument.uri) {
            newErrors.file = 'Please select a document/image to upload.';
        }
        if (!currentDocument.name.trim()) {
            newErrors.name = 'Document name is required.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsProcessing(true); // Indicate processing for Base64 conversion
        try {
            // Re-read base64 to ensure it's fresh and correctly handled
            const base64String = await FileSystem.readAsStringAsync(currentDocument.uri!, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (!base64String) {
                throw new Error("Failed to convert document to Base64.");
            }

            const newDoc: SupportingDocument = {
                id: `doc-${Date.now()}`,
                uri: currentDocument.uri!,
                name: currentDocument.name.trim(),
                description: currentDocument.description.trim(),
                mimeType: currentDocument.mimeType!, // Ensure mimeType is captured
                base64: base64String, // Store the actual base64 content
            };

            setUploadedDocuments(prev => [...prev, newDoc]);
            setCurrentDocument({ uri: null, name: '', description: '', mimeType: null }); // Reset form
            setShowDocumentForm(false);
            setErrors({}); // Clear errors
        } catch (error: any) {
            Alert.alert('Upload Error', `Failed to process document: ${error.message || 'Unknown error'}.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveDocument = (id: string) => {
        Alert.alert(
            'Remove Document',
            'Are you sure you want to remove this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', onPress: () => setUploadedDocuments(prev => prev.filter(doc => doc.id !== id)) }
            ]
        );
    };

    const handleFinishOnboarding = () => {
        if (uploadedDocuments.length === 0) {
            Alert.alert('Requirement', 'Please upload at least one supporting document to prove your skills.');
            return;
        }

        // Combine all data from previous steps and this step
        const finalOnboardingData: AllOnboardingData = {
            ...receivedOnboardingData as AllOnboardingData, // Cast to full type
            supportingDocuments: uploadedDocuments, // Add documents from this screen
            onboardingStatus: 'pendingVerification', // Set a status for admin review
            submissionDate: new Date().toISOString(), // Timestamp for submission
        };

        // --- START: The ONLY LOG remaining ---
        console.log("--------------------------------------------------");
        console.log("FINAL COLLECTED ONBOARDING DATA (Passing to Profile screen):");
        console.log(JSON.stringify(finalOnboardingData, null, 2));
        console.log("--------------------------------------------------");
        // --- END: The ONLY LOG remaining ---

        // *** MODIFIED NAVIGATION PATH ***
        router.push({
            pathname: '/tasker-onboarding/profile', // Changed from submission-complete
            params: {
                onboardingData: JSON.stringify(finalOnboardingData), // Pass the entire object
            },
        });
    };

    // Helper to render document preview
    const renderDocumentPreview = (uri: string, mimeType: string) => {
        if (mimeType && mimeType.startsWith('image/')) {
            return <Image source={{ uri: uri }} style={styles.previewImage} />;
        } else if (mimeType && mimeType === 'application/pdf') {
            return (
                <View style={styles.pdfPreview}>
                    <Ionicons name="document-text-outline" size={80} color="#ff4444" />
                    <Text style={styles.pdfPreviewText}>PDF Document</Text>
                </View>
            );
        }
        return (
            <View style={styles.genericPreview}>
                <Ionicons name="document-outline" size={80} color="#666" />
                <Text style={styles.pdfPreviewText}>File Preview</Text>
            </View>
        );
    };


    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Supporting Documents</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Upload documents or images that showcase your skills and experience. This could include academic certificates, referral letters, portfolios, or work samples in formats like JPG, PNG, or PDF.
                </Text>

                {/* Section to add a new document */}
                {!showDocumentForm && ( // Only show "Add Document" button if form is not active
                    <TouchableOpacity style={styles.addDocumentButton} onPress={pickDocument} disabled={isProcessing}>
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#4A80F0" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={24} color="#4A80F0" />
                                <Text style={styles.addDocumentButtonText}>Upload New Document</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Document details form (shown after picking an image/document) */}
                {showDocumentForm && (
                    <View style={styles.documentForm}>
                        <Text style={styles.formTitle}>Document Details</Text>
                        {currentDocument.uri && currentDocument.mimeType && (
                            renderDocumentPreview(currentDocument.uri, currentDocument.mimeType)
                        )}
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            value={currentDocument.name}
                            onChangeText={(text) => {
                                setCurrentDocument(prev => ({ ...prev, name: text }));
                                if (errors.name) setErrors(prev => { const newErrors = { ...prev }; delete newErrors.name; return newErrors; });
                            }}
                            placeholder="Document Name (e.g., 'Plumbing Certificate', 'Client Referral')"
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                        <TextInput
                            style={styles.descriptionInput}
                            value={currentDocument.description}
                            onChangeText={(text) => setCurrentDocument(prev => ({ ...prev, description: text }))}
                            placeholder="Description (e.g., 'Certified in advanced plumbing techniques')"
                            multiline
                        />
                        {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}

                        <TouchableOpacity style={styles.saveButton} onPress={handleAddDocument} disabled={isProcessing}>
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Add Document</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => {
                            setShowDocumentForm(false);
                            setCurrentDocument({ uri: null, name: '', description: '', mimeType: null });
                            setErrors({});
                        }}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Display uploaded documents */}
                {uploadedDocuments.length > 0 && (
                    <View style={styles.uploadedDocumentsContainer}>
                        <Text style={styles.sectionTitle}>Uploaded Documents</Text>
                        {uploadedDocuments.map(doc => (
                            <View key={doc.id} style={styles.documentCard}>
                                <View style={styles.documentCardHeader}>
                                    <Text style={styles.documentName}>{doc.name}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveDocument(doc.id)} style={styles.removeButton}>
                                        <Ionicons name="close-circle-outline" size={24} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                                {doc.description ? (
                                    <Text style={styles.documentDescription}>{doc.description}</Text>
                                ) : (
                                    <Text style={styles.documentDescriptionPlaceholder}>No description provided.</Text>
                                )}
                                {renderDocumentPreview(doc.uri, doc.mimeType)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Finish Onboarding Button */}
                <TouchableOpacity style={styles.button} onPress={handleFinishOnboarding} disabled={isProcessing}>
                    {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Finish Onboarding</Text>
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        marginTop: 20,
    },
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6f0ff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4A80F0',
        marginBottom: 20,
        gap: 10,
    },
    addDocumentButtonText: {
        fontSize: 16,
        color: '#4A80F0',
        fontWeight: '600',
    },
    documentForm: {
        backgroundColor: '#f8f9fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        resizeMode: 'contain', // Changed to contain for better document image fit
        marginBottom: 15,
        borderColor: '#eee',
        borderWidth: 1,
    },
    pdfPreview: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#eee',
        borderWidth: 1,
    },
    genericPreview: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#eee',
        borderWidth: 1,
    },
    pdfPreviewText: {
        marginTop: 5,
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    descriptionInput: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    saveButton: {
        backgroundColor: '#4A80F0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#cccccc',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    uploadedDocumentsContainer: {
        marginTop: 20,
    },
    documentCard: {
        backgroundColor: '#f8f9fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    documentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flexShrink: 1,
    },
    removeButton: {
        padding: 5,
    },
    documentDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    documentDescriptionPlaceholder: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    uploadedDocumentPreview: { // This style is for the small preview in the list
        width: '100%',
        height: 100, // Smaller preview
        borderRadius: 8,
        resizeMode: 'contain',
        marginTop: 5,
        borderColor: '#eee',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        textAlign: 'left',
    },
    inputError: {
        borderColor: '#ff4444',
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