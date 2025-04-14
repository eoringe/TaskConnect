import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Common areas in Nairobi
const SUGGESTED_AREAS = [
    'Westlands',
    'Kilimani',
    'Kileleshwa',
    'Lavington',
    'Karen',
    'Parklands',
    'South B',
    'South C',
    'Eastleigh',
    'Kasarani',
    'Roysambu',
    'Kahawa',
    'Ruaka',
    'Kitengela',
    'Rongai',
];

export default function AreasServedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [customArea, setCustomArea] = useState('');
    const [error, setError] = useState<string | null>(null);

    const toggleArea = (area: string) => {
        setSelectedAreas(prev => {
            if (prev.includes(area)) {
                return prev.filter(a => a !== area);
            }
            return [...prev, area];
        });
        setError(null);
    };

    const addCustomArea = () => {
        if (customArea.trim()) {
            if (!selectedAreas.includes(customArea.trim())) {
                setSelectedAreas(prev => [...prev, customArea.trim()]);
                setCustomArea('');
            }
        }
    };

    const handleNext = () => {
        if (selectedAreas.length === 0) {
            setError('Please select at least one area');
            return;
        }

        router.push({
            pathname: '/tasker-onboarding/services',
            params: {
                personalDetails: params.personalDetails,
                idVerification: params.idVerification,
                areasServed: JSON.stringify(selectedAreas),
            },
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Areas Served</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Select the areas where you're available to work. You can choose multiple areas to increase your opportunities.
                </Text>

                <View style={styles.customAreaContainer}>
                    <TextInput
                        style={styles.customAreaInput}
                        value={customArea}
                        onChangeText={setCustomArea}
                        placeholder="Add a custom area"
                        onSubmitEditing={addCustomArea}
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !customArea.trim() && styles.addButtonDisabled]}
                        onPress={addCustomArea}
                        disabled={!customArea.trim()}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Suggested Areas</Text>
                <View style={styles.areasGrid}>
                    {SUGGESTED_AREAS.map((area) => (
                        <TouchableOpacity
                            key={area}
                            style={[
                                styles.areaButton,
                                selectedAreas.includes(area) && styles.areaButtonSelected,
                            ]}
                            onPress={() => toggleArea(area)}
                        >
                            <Text style={[
                                styles.areaButtonText,
                                selectedAreas.includes(area) && styles.areaButtonTextSelected,
                            ]}>
                                {area}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedAreas.length > 0 && (
                    <View style={styles.selectedAreasContainer}>
                        <Text style={styles.sectionTitle}>Selected Areas</Text>
                        <View style={styles.selectedAreasList}>
                            {selectedAreas.map((area) => (
                                <View key={area} style={styles.selectedAreaTag}>
                                    <Text style={styles.selectedAreaText}>{area}</Text>
                                    <TouchableOpacity onPress={() => toggleArea(area)}>
                                        <Ionicons name="close-circle" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {error && (
                    <Text style={styles.errorText}>{error}</Text>
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
    customAreaContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },
    customAreaInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#f8f9fd',
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4A80F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    areasGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    areaButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f8f9fd',
        borderWidth: 1,
        borderColor: '#eee',
    },
    areaButtonSelected: {
        backgroundColor: '#4A80F0',
        borderColor: '#4A80F0',
    },
    areaButtonText: {
        fontSize: 14,
        color: '#666',
    },
    areaButtonTextSelected: {
        color: '#fff',
        fontWeight: '500',
    },
    selectedAreasContainer: {
        marginBottom: 30,
    },
    selectedAreasList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    selectedAreaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f0f5ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    selectedAreaText: {
        fontSize: 14,
        color: '#4A80F0',
        fontWeight: '500',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginBottom: 15,
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