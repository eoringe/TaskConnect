import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, getFirestore } from 'firebase/firestore'; // Import Firestore functions
import { app } from '../../firebase-config'; // Assuming you have your firebase app config here

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
    category: string; // The predefined category (e.g., "Cleaning", "Handyman")
    title: string;    // The user-defined title for this service instance
    rate: string;     // Can now be a single number or a range (e.g., "5000" or "5000-6000")
    description: string;
    isCustom?: boolean; // True if it's a custom service
};

// This type represents ALL data collected up to the Services screen
type AllOnboardingData = PersonalDetails & IDVerificationFormData & AreasServedFormData & {
    services: Service[];
};

// Define a type for the fetched service category from Firestore
type ServiceCategory = {
    id: string;
    name: string;
    icon: string;
};

export default function ServicesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const db = getFirestore(app); // Initialize Firestore

    const receivedOnboardingData: Partial<AllOnboardingData> = params.onboardingData
        ? JSON.parse(params.onboardingData as string)
        : {};

    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [customService, setCustomService] = useState({
        title: '',
        rate: '',
        description: '',
    });
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingError, setFetchingError] = useState<string | null>(null);

    // Effect to fetch service categories from Firestore
    useEffect(() => {
        const fetchServiceCategories = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'serviceCategories'));
                const categories: ServiceCategory[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Exclude the category named "All"
                    if (data.name !== 'All') {
                        categories.push({
                            id: doc.id,
                            name: data.name,
                            icon: data.icon,
                        });
                    }
                });
                setAvailableCategories(categories);
            } catch (error) {
                console.error('Error fetching service categories:', error);
                setFetchingError('Failed to load service categories. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchServiceCategories();
    }, [db]); // Depend on db instance

    // Effect to handle initial population or re-routing if data is missing
    useEffect(() => {
        if (!receivedOnboardingData.firstName) {
            Alert.alert('Error', 'Previous onboarding data missing. Please restart the onboarding process.');
            router.replace('/tasker-onboarding/personal-details');
        }
    }, [receivedOnboardingData, router]);

    const validateRate = (rate: string): boolean => {
        const trimmedRate = rate.trim();
        const rateRegex = /^\d+(\s*-\s*\d+)?$/;
        return rateRegex.test(trimmedRate);
    };

    const handleServiceSelect = (serviceId: string, serviceCategoryName: string) => {
        const existingService = selectedServices.find(s => s.id === serviceId);

        if (existingService) {
            setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
            if (editingService?.id === serviceId) {
                setEditingService(null);
            }
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[serviceId + '_title'];
                delete newErrors[serviceId + '_rate'];
                return newErrors;
            });
        } else {
            setEditingService({
                id: serviceId,
                category: serviceCategoryName,
                title: serviceCategoryName,
                rate: '',
                description: '',
            });
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[serviceId + '_title'];
                delete newErrors[serviceId + '_rate'];
                return newErrors;
            });
        }
    };

    const handleServiceSave = (service: Service) => {
        const newErrors: {[key: string]: string} = {};

        if (!service.title.trim()) {
            newErrors[service.id + '_title'] = 'Service title is required';
        }
        if (!service.rate.trim()) {
            newErrors[service.id + '_rate'] = 'Rate is required';
        } else if (!validateRate(service.rate)) {
            newErrors[service.id + '_rate'] = 'Rate must be a number or a range (e.g., 5000 or 5000-6000)';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSelectedServices(prev => {
            const existingIndex = prev.findIndex(s => s.id === service.id);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = service;
                return updated;
            }
            return [...prev, service];
        });
        setErrors({});
        setEditingService(null);
    };

    const handleCustomServiceAdd = () => {
        const newErrors: {[key: string]: string} = {};

        if (!customService.title.trim()) {
            newErrors.customTitle = 'Service title is required';
        }
        if (!customService.rate.trim()) {
            newErrors.customRate = 'Rate is required';
        } else if (!validateRate(customService.rate)) {
            newErrors.customRate = 'Rate must be a number or a range (e.g., 5000 or 5000-6000)';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newService: Service = {
            id: `custom-${Date.now()}`,
            category: 'Custom',
            title: customService.title.trim(),
            rate: customService.rate,
            description: customService.description.trim(),
            isCustom: true,
        };

        setSelectedServices(prev => [...prev, newService]);
        setCustomService({ title: '', rate: '', description: '' });
        setShowCustomForm(false);
        setErrors({});
    };

    const handleNext = () => {
        if (selectedServices.length === 0) {
            Alert.alert('Error', 'Please select at least one service and set its details.');
            return;
        }

        const incompleteServices = selectedServices.filter(s =>
            !s.title.trim() || !s.rate.trim() || !validateRate(s.rate)
        );

        if (incompleteServices.length > 0) {
            Alert.alert(
                'Incomplete Services',
                'Please ensure all selected services have a valid title and rate saved. Rate must be a number or a range (e.g., 5000 or 5000-6000).'
            );
            setEditingService(incompleteServices[0]);
            return;
        }

        const dataToPass: AllOnboardingData = {
            ...receivedOnboardingData as AllOnboardingData,
            services: selectedServices,
        };

        console.log("--------------------------------------------------");
        console.log("ALL COLLECTED ONBOARDING DATA (Passing to Supporting Documents screen):");
        console.log(JSON.stringify(dataToPass, null, 2));
        console.log("--------------------------------------------------");

        router.push({
            pathname: '/tasker-onboarding/supporting-documents',
            params: {
                onboardingData: JSON.stringify(dataToPass),
            },
        });
    };

    const renderServiceEditor = (service: Service) => (
        <View style={styles.serviceEditor}>
            <Text style={styles.serviceEditorCategory}>Category: {service.category}</Text>
            <Text style={styles.serviceEditorTitleLabel}>Title</Text>
            <TextInput
                style={[styles.input, errors[service.id + '_title'] && styles.inputError]}
                value={service.title}
                onChangeText={(text) => {
                    setEditingService({ ...service, title: text });
                    if (errors[service.id + '_title']) {
                        setErrors(prev => { const newErrors = { ...prev }; delete newErrors[service.id + '_title']; return newErrors; });
                    }
                }}
                placeholder="Enter a title for your service"
            />
            {errors[service.id + '_title'] && (
                <Text style={styles.errorText}>{errors[service.id + '_title']}</Text>
            )}

            <Text style={styles.serviceEditorTitleLabel}>Rate</Text>
            <View style={styles.rateInput}>
                <Text style={styles.currencySymbol}>KSh</Text>
                <TextInput
                    style={[styles.rateTextInput, errors[service.id + '_rate'] && styles.inputError]}
                    value={service.rate}
                    onChangeText={(text) => {
                        setEditingService({ ...service, rate: text });
                        if (errors[service.id + '_rate']) {
                            setErrors(prev => { const newErrors = { ...prev }; delete newErrors[service.id + '_rate']; return newErrors; });
                        }
                    }}
                    placeholder="e.g., 5000 or 5000-6000"
                    keyboardType="default"
                />
                <Text style={styles.rateUnit}>/task</Text>
            </View>
            {errors[service.id + '_rate'] && (
                <Text style={styles.errorText}>{errors[service.id + '_rate']}</Text>
            )}

            <Text style={styles.serviceEditorTitleLabel}>Description (Optional)</Text>
            <TextInput
                style={styles.descriptionInput}
                value={service.description}
                onChangeText={(text) => setEditingService({ ...service, description: text })}
                placeholder="Add details about your service (e.g., 'deep cleaning for apartments')"
                multiline
            />
            <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleServiceSave(service)}
            >
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                    setEditingService(null);
                    setErrors({});
                    if (!selectedServices.some(s => s.id === service.id)) {
                        setSelectedServices(prev => prev.filter(s => s.id !== service.id));
                    }
                }}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Services & Pricing</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Select the service categories you want to offer. For each, you can define a specific title, rate, and description.
                </Text>

                <Text style={styles.sectionTitle}>Available Service Categories</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#4A80F0" />
                ) : fetchingError ? (
                    <Text style={styles.errorText}>{fetchingError}</Text>
                ) : (
                    <View style={styles.servicesGrid}>
                        {availableCategories.map((service) => {
                            const isSelected = selectedServices.some(s => s.id === service.id);
                            return (
                                <TouchableOpacity
                                    key={service.id}
                                    style={[
                                        styles.serviceButton,
                                        isSelected && styles.serviceButtonSelected,
                                    ]}
                                    onPress={() => handleServiceSelect(service.id, service.name)}
                                >
                                    <Ionicons
                                        name={service.icon as any} // Cast to any because Ionicons expects a specific string literal type
                                        size={24}
                                        color={isSelected ? '#fff' : '#666'}
                                    />
                                    <Text style={[
                                        styles.serviceButtonText,
                                        isSelected && styles.serviceButtonTextSelected,
                                    ]}>
                                        {service.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {editingService && renderServiceEditor(editingService)}

                {!editingService && (
                    <>
                        <TouchableOpacity
                            style={styles.addCustomButton}
                            onPress={() => {
                                setShowCustomForm(true);
                                setErrors({});
                                setCustomService({ title: '', rate: '', description: '' });
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#4A80F0" />
                            <Text style={styles.addCustomButtonText}>Add Custom Service</Text>
                        </TouchableOpacity>

                        {showCustomForm && (
                            <View style={styles.customServiceForm}>
                                <Text style={styles.serviceEditorTitleLabel}>Service Title</Text>
                                <TextInput
                                    style={[styles.input, errors.customTitle && styles.inputError]}
                                    value={customService.title}
                                    onChangeText={(text) => {
                                        setCustomService({ ...customService, title: text });
                                        if (errors.customTitle) {
                                            setErrors(prev => { const newErrors = { ...prev }; delete newErrors.customTitle; return newErrors; });
                                        }
                                    }}
                                    placeholder="e.g., 'Personal Assistant for Errands'"
                                />
                                {errors.customTitle && (
                                    <Text style={styles.errorText}>{errors.customTitle}</Text>
                                )}

                                <Text style={styles.serviceEditorTitleLabel}>Rate</Text>
                                <View style={styles.rateInput}>
                                    <Text style={styles.currencySymbol}>KSh</Text>
                                    <TextInput
                                        style={[styles.rateTextInput, errors.customRate && styles.inputError]}
                                        value={customService.rate}
                                        onChangeText={(text) => {
                                            setCustomService({ ...customService, rate: text });
                                            if (errors.customRate) {
                                                setErrors(prev => { const newErrors = { ...prev }; delete newErrors.customRate; return newErrors; });
                                            }
                                        }}
                                        placeholder="e.g., 5000 or 5000-6000"
                                        keyboardType="default"
                                    />
                                    <Text style={styles.rateUnit}>/task</Text>
                                </View>
                                {errors.customRate && (
                                    <Text style={styles.errorText}>{errors.customRate}</Text>
                                )}
                                <Text style={styles.serviceEditorTitleLabel}>Description (Optional)</Text>
                                <TextInput
                                    style={styles.descriptionInput}
                                    value={customService.description}
                                    onChangeText={(text) => setCustomService({ ...customService, description: text })}
                                    placeholder="Describe your custom service in detail"
                                    multiline
                                />
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleCustomServiceAdd}
                                >
                                    <Text style={styles.saveButtonText}>Add Service</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowCustomForm(false);
                                        setErrors({});
                                        setCustomService({ title: '', rate: '', description: '' });
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedServices.length > 0 && (
                            <View style={styles.selectedServicesContainer}>
                                <Text style={styles.sectionTitle}>Your Added Services</Text>
                                {selectedServices.map((service) => (
                                    <View key={service.id} style={styles.selectedServiceCard}>
                                        <View style={styles.selectedServiceHeader}>
                                            <Text style={styles.selectedServiceCategory}>{service.category}</Text>
                                            <TouchableOpacity
                                                onPress={() => setEditingService(service)}
                                                style={styles.editButton}
                                            >
                                                <Ionicons name="pencil" size={20} color="#4A80F0" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.selectedServiceTitle}>{service.title}</Text>
                                        <Text style={styles.selectedServiceRate}>KSh {service.rate}/task</Text>
                                        {service.description && (
                                            <Text style={styles.selectedServiceDescription}>
                                                {service.description}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    serviceButton: {
        width: '48%', // Approx half with gap
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#f8f9fd',
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        gap: 8,
    },
    serviceButtonSelected: {
        backgroundColor: '#4A80F0',
        borderColor: '#4A80F0',
    },
    serviceButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    serviceButtonTextSelected: {
        color: '#fff',
    },
    serviceEditor: {
        backgroundColor: '#f8f9fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    serviceEditorCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        fontWeight: '500',
    },
    serviceEditorTitleLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '500',
    },
    rateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    currencySymbol: {
        fontSize: 16,
        color: '#333',
        marginRight: 5,
    },
    rateTextInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    rateUnit: {
        fontSize: 16,
        color: '#666',
        marginLeft: 5,
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
        marginBottom: 5,
    },
    addCustomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    addCustomButtonText: {
        fontSize: 16,
        color: '#4A80F0',
        fontWeight: '500',
    },
    customServiceForm: {
        backgroundColor: '#f8f9fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
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
    saveButton: {
        backgroundColor: '#4A80F0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
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
    selectedServicesContainer: {
        marginBottom: 30,
    },
    selectedServiceCard: {
        backgroundColor: '#f8f9fd',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedServiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    selectedServiceCategory: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    selectedServiceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    editButton: {
        padding: 5,
    },
    selectedServiceRate: {
        fontSize: 14,
        color: '#4A80F0',
        fontWeight: '500',
        marginBottom: 5,
    },
    selectedServiceDescription: {
        fontSize: 14,
        color: '#666',
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
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});