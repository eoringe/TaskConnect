import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Service = {
    id: string;
    name: string;
    rate: string;
    description: string;
    isCustom?: boolean;
};

const PREDEFINED_SERVICES = [
    { id: 'cleaning', name: 'Cleaning', icon: 'brush-outline' },
    { id: 'handyman', name: 'Handyman', icon: 'construct-outline' },
    { id: 'moving', name: 'Moving Help', icon: 'car-outline' },
    { id: 'gardening', name: 'Gardening', icon: 'leaf-outline' },
    { id: 'painting', name: 'Painting', icon: 'color-palette-outline' },
    { id: 'electrical', name: 'Electrical', icon: 'flash-outline' },
    { id: 'plumbing', name: 'Plumbing', icon: 'water-outline' },
    { id: 'carpentry', name: 'Carpentry', icon: 'hammer-outline' },
];

export default function ServicesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [customService, setCustomService] = useState({
        name: '',
        rate: '',
        description: '',
    });
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const validateRate = (rate: string): boolean => {
        return /^\d+$/.test(rate);
    };

    const handleServiceSelect = (serviceId: string, serviceName: string) => {
        if (selectedServices.some(s => s.id === serviceId)) {
            setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
        } else {
            setEditingService({
                id: serviceId,
                name: serviceName,
                rate: '',
                description: '',
            });
        }
    };

    const handleServiceSave = (service: Service) => {
        if (!service.rate) {
            setErrors({ ...errors, [service.id]: 'Rate is required' });
            return;
        }
        if (!validateRate(service.rate)) {
            setErrors({ ...errors, [service.id]: 'Rate must be a number' });
            return;
        }

        setSelectedServices(prev => {
            const existing = prev.findIndex(s => s.id === service.id);
            if (existing !== -1) {
                const updated = [...prev];
                updated[existing] = service;
                return updated;
            }
            return [...prev, service];
        });
        setErrors({});
        setEditingService(null);
    };

    const handleCustomServiceAdd = () => {
        if (!customService.name.trim()) {
            setErrors({ custom: 'Service name is required' });
            return;
        }
        if (!customService.rate.trim()) {
            setErrors({ custom: 'Rate is required' });
            return;
        }
        if (!validateRate(customService.rate)) {
            setErrors({ custom: 'Rate must be a number' });
            return;
        }

        const newService: Service = {
            id: `custom-${Date.now()}`,
            name: customService.name.trim(),
            rate: customService.rate,
            description: customService.description.trim(),
            isCustom: true,
        };

        setSelectedServices(prev => [...prev, newService]);
        setCustomService({ name: '', rate: '', description: '' });
        setShowCustomForm(false);
        setErrors({});
    };

    const handleNext = () => {
        if (selectedServices.length === 0) {
            Alert.alert('Error', 'Please select at least one service');
            return;
        }

        router.push({
            pathname: '/tasker-onboarding/payment-methods',
            params: {
                personalDetails: params.personalDetails,
                idVerification: params.idVerification,
                areasServed: params.areasServed,
                services: JSON.stringify(selectedServices),
            },
        });
    };

    const renderServiceEditor = (service: Service) => (
        <View style={styles.serviceEditor}>
            <Text style={styles.serviceEditorTitle}>Set your rate for {service.name}</Text>
            <View style={styles.rateInput}>
                <Text style={styles.currencySymbol}>KSh</Text>
                <TextInput
                    style={styles.rateTextInput}
                    value={service.rate}
                    onChangeText={(text) => {
                        setEditingService({ ...service, rate: text });
                        if (errors[service.id]) {
                            setErrors({ ...errors, [service.id]: '' });
                        }
                    }}
                    placeholder="Enter rate"
                    keyboardType="number-pad"
                />
                <Text style={styles.rateUnit}>/task</Text>
            </View>
            <TextInput
                style={styles.descriptionInput}
                value={service.description}
                onChangeText={(text) => setEditingService({ ...service, description: text })}
                placeholder="Add details about your service (optional)"
                multiline
            />
            {errors[service.id] && (
                <Text style={styles.errorText}>{errors[service.id]}</Text>
            )}
            <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleServiceSave(service)}
            >
                <Text style={styles.saveButtonText}>Save</Text>
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
                    Select the services you want to offer and set your rates. You can also add custom services.
                </Text>

                <Text style={styles.sectionTitle}>Available Services</Text>
                <View style={styles.servicesGrid}>
                    {PREDEFINED_SERVICES.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={[
                                styles.serviceButton,
                                selectedServices.some(s => s.id === service.id) && styles.serviceButtonSelected,
                            ]}
                            onPress={() => handleServiceSelect(service.id, service.name)}
                        >
                            <Ionicons
                                name={service.icon as any}
                                size={24}
                                color={selectedServices.some(s => s.id === service.id) ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.serviceButtonText,
                                selectedServices.some(s => s.id === service.id) && styles.serviceButtonTextSelected,
                            ]}>
                                {service.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {editingService && renderServiceEditor(editingService)}

                {!editingService && (
                    <>
                        <TouchableOpacity
                            style={styles.addCustomButton}
                            onPress={() => setShowCustomForm(true)}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#4A80F0" />
                            <Text style={styles.addCustomButtonText}>Add Custom Service</Text>
                        </TouchableOpacity>

                        {showCustomForm && (
                            <View style={styles.customServiceForm}>
                                <TextInput
                                    style={styles.input}
                                    value={customService.name}
                                    onChangeText={(text) => setCustomService({ ...customService, name: text })}
                                    placeholder="Service name"
                                />
                                <View style={styles.rateInput}>
                                    <Text style={styles.currencySymbol}>KSh</Text>
                                    <TextInput
                                        style={styles.rateTextInput}
                                        value={customService.rate}
                                        onChangeText={(text) => setCustomService({ ...customService, rate: text })}
                                        placeholder="Rate"
                                        keyboardType="number-pad"
                                    />
                                    <Text style={styles.rateUnit}>/task</Text>
                                </View>
                                <TextInput
                                    style={styles.descriptionInput}
                                    value={customService.description}
                                    onChangeText={(text) => setCustomService({ ...customService, description: text })}
                                    placeholder="Service description (optional)"
                                    multiline
                                />
                                {errors.custom && (
                                    <Text style={styles.errorText}>{errors.custom}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleCustomServiceAdd}
                                >
                                    <Text style={styles.saveButtonText}>Add Service</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedServices.length > 0 && (
                            <View style={styles.selectedServicesContainer}>
                                <Text style={styles.sectionTitle}>Your Services</Text>
                                {selectedServices.map((service) => (
                                    <View key={service.id} style={styles.selectedServiceCard}>
                                        <View style={styles.selectedServiceHeader}>
                                            <Text style={styles.selectedServiceName}>{service.name}</Text>
                                            <TouchableOpacity
                                                onPress={() => setEditingService(service)}
                                                style={styles.editButton}
                                            >
                                                <Ionicons name="pencil" size={20} color="#4A80F0" />
                                            </TouchableOpacity>
                                        </View>
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
        width: '48%',
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
    serviceEditorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
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
    selectedServiceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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