import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce'; // Make sure you have installed lodash.debounce

// --- Firebase Imports (Uncomment when ready to integrate Firestore) ---
// import { getFirestore, doc, setDoc } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// --- Mapbox Configuration ---
// IMPORTANT: Replace 'YOUR_MAPBOX_PUBLIC_ACCESS_TOKEN' with the token you copied from your Mapbox dashboard.
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZW1tYW51ZWxvcmluZ2UiLCJhIjoiY21ib3Y0amEzMXRndjJsc2RhdzdvMGRtOSJ9.dmRs4J8gMykWqHuK2kb5jA'; // <<< PASTE YOUR TOKEN HERE!
const MAPBOX_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export default function AreasServedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInputFocused, setIsInputFocused] = useState(false); // To control search results visibility

    // Function to handle fetching search results from Mapbox
    const fetchMapboxResults = useCallback(async (text: string) => {
        // Corrected check for Mapbox Access Token.
        // It should only warn if the token is literally the placeholder string
        // or if it's empty/null.
        if (
            !MAPBOX_ACCESS_TOKEN ||
            (typeof MAPBOX_ACCESS_TOKEN === 'string' && MAPBOX_ACCESS_TOKEN.includes('YOUR_MAPBOX_PUBLIC_ACCESS_TOKEN'))
        ) {
            const configError = 'Mapbox Access Token is not configured. Please replace "YOUR_MAPBOX_PUBLIC_ACCESS_TOKEN" with your actual token in the code.';
            console.error(configError); // Log to console for developer
            setError(configError); // Display to user
            setLoadingSearch(false);
            return;
        }

        if (text.trim().length < 3) { // Only search for queries longer than 2 characters
            setSearchResults([]);
            setLoadingSearch(false);
            return;
        }

        setLoadingSearch(true);
        setError(null); // Clear previous errors
        try {
            const encodedQuery = encodeURIComponent(text.trim());
            // Construct the Mapbox Geocoding API URL
            const url = `${MAPBOX_API_URL}/${encodedQuery}.json?` +
                        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
                        `country=ke&` + // Restrict to Kenya
                        `types=place,locality,neighborhood,poi&` + // Suggest types like cities, suburbs, points of interest
                        `limit=10&` + // Limit results to 10
                        `language=en`; // Prefer English results

            // Optionally, bias results to a specific location (e.g., Nairobi's approximate center)
            // If you have a user's current location, use that for `proximity`
            // const proximity = '36.8219, -1.2921'; // Longitude, Latitude for Nairobi
            // url += `&proximity=${proximity}`;


            console.log("Fetching Mapbox URL:", url); // Log the URL for debugging

            const response = await fetch(url);

            // Check if the HTTP response was successful (status 200-299)
            if (!response.ok) {
                const errorBody = await response.text(); // Get the raw response body for debugging
                console.error(`Mapbox API returned HTTP ${response.status}:`, errorBody); // Log full error body

                let specificError = `Search failed: ${response.status} ${response.statusText}.`;
                if (response.status === 401 || response.status === 403) {
                    specificError += " Check your Mapbox Access Token or its permissions.";
                    console.error("Possible Mapbox Token Issue:", errorBody); // More detailed log
                } else if (response.status === 429) {
                    specificError += " You've hit Mapbox rate limits. Consider upgrading your plan if this persists.";
                    console.warn("Mapbox Rate Limit Hit:", errorBody); // Warning for rate limits
                } else if (response.headers.get('Content-Type')?.includes('text/html')) {
                    specificError += " Server returned HTML instead of JSON. This often indicates an error page from Mapbox.";
                    console.error("Mapbox HTML Error Page:", errorBody); // Log HTML content
                }
                setError(specificError);
                setSearchResults([]);
                return; // Stop processing
            }

            // Parse the JSON response
            const data = await response.json();
            console.log("Mapbox API Response Data:", data); // Log the raw JSON data

            // Mapbox returns results in 'features' array
            // The primary name is usually in 'text' property of each feature
            const uniqueResults = Array.from(new Set<string>(data.features.map((item: any) => {
                if (typeof item.place_name === 'string') {
                    return item.place_name.trim();
                }
                return '';
            }))).filter((r: string) => r.length > 0);

            console.log("Processed Search Results:", uniqueResults); // Log processed results
            setSearchResults(uniqueResults);

        } catch (err: any) {
            console.error("Error fetching Mapbox search results (Catch Block):", err); // Log full error object
            setError("A network error occurred during search. Please check your internet connection.");
            setSearchResults([]); // Clear results on error
        } finally {
            setLoadingSearch(false);
        }
    }, []); // useCallback ensures this function is stable and doesn't recreate on every render

    // Debounce the search function
    const debouncedSearch = useRef(debounce(fetchMapboxResults, 500)).current;

    // Trigger search when searchQuery changes
    useEffect(() => {
        if (searchQuery.trim().length > 0 && isInputFocused) {
            debouncedSearch(searchQuery);
        } else {
            debouncedSearch.cancel(); // Cancel any pending debounce call
            setSearchResults([]); // Clear results if query is empty or input not focused
            setLoadingSearch(false); // Ensure loading is off
        }
        return () => {
            debouncedSearch.cancel(); // Cleanup debounce on unmount
        };
    }, [searchQuery, debouncedSearch, isInputFocused]);

    const toggleArea = (area: string) => {
        setSelectedAreas(prev => {
            if (prev.includes(area)) {
                return prev.filter(a => a !== area);
            }
            return [...prev, area];
        });
        setError(null); // Clear error when an area is selected/deselected

        // After selecting, clear search input and results, and dismiss keyboard
        setSearchQuery('');
        setSearchResults([]);
        Keyboard.dismiss();
    };

    const handleNext = async () => {
        if (selectedAreas.length === 0) {
            setError('Please select at least one area where you are available to work.');
            return;
        }

        // --- Start: Firebase Firestore Save Integration ---
        /*
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Authentication Required', 'Please log in to save your areas served.');
                router.replace('/login');
                return;
            }

            const db = getFirestore();
            const taskerDocRef = doc(db, 'taskers', user.uid);

            const areasData = {
                areasServed: selectedAreas,
                onboardingStep: 'areasServedCompleted',
            };

            console.log("Attempting to save 'areasServed' to Firestore:", areasData);
            await setDoc(taskerDocRef, areasData, { merge: true });
            console.log('Areas served data saved to Firestore successfully.');

        } catch (firestoreError: any) {
            console.error("Error saving areas served to Firestore:", firestoreError);
            Alert.alert(
                'Save Error',
                `Failed to save your service areas: ${firestoreError.message || 'Please try again.'}`
            );
            return;
        }
        */
        // --- End: Firebase Firestore Save Integration ---

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
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Areas Served</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    Specify the areas where you're available to work by searching for specific locations, towns, or neighborhoods.
                </Text>

                {/* Search Input Section */}
                <View style={styles.searchSection}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a location (e.g., Kilimani, Ruiru)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => {
                            setTimeout(() => setIsInputFocused(false), 200);
                        }}
                        autoCapitalize="words"
                        returnKeyType="search"
                        onSubmitEditing={() => {
                            if (searchQuery.trim().length >= 3) {
                                fetchMapboxResults(searchQuery); // Directly call on submit
                            }
                        }}
                    />
                    {loadingSearch && <ActivityIndicator size="small" color="#4A80F0" style={styles.searchLoadingIndicator} />}
                    {searchQuery.length > 0 && !loadingSearch && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); Keyboard.dismiss(); }} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Results Display */}
                {isInputFocused && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                        <Text style={styles.searchResultsTitle}>Suggestions</Text>
                        {searchResults.map((area, index) => (
                            <TouchableOpacity
                                key={area + index}
                                style={styles.searchResultItem}
                                onPress={() => toggleArea(area)}
                            >
                                <Text style={styles.searchResultText}>{area}</Text>
                                {selectedAreas.includes(area) && (
                                    <Ionicons name="checkmark-circle" size={20} color="#4A80F0" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Display Selected Areas */}
                {selectedAreas.length > 0 && (
                    <View style={styles.selectedAreasContainer}>
                        <Text style={styles.sectionTitle}>Your Selected Service Areas</Text>
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

                {/* Error Display */}
                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                {/* Next Button */}
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
        marginBottom: 20,
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9fd',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    searchLoadingIndicator: {
        marginLeft: 10,
    },
    clearSearchButton: {
        marginLeft: 10,
        padding: 5,
    },
    searchResultsContainer: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
        marginBottom: 20,
        zIndex: 10,
    },
    searchResultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchResultItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    searchResultText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 10,
        marginBottom: 15,
    },
    selectedAreasContainer: {
        marginBottom: 20,
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
        backgroundColor: '#e6f0ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#a0c8ff',
    },
    selectedAreaText: {
        fontSize: 14,
        color: '#4A80F0',
        fontWeight: '500',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginTop: 15,
        marginBottom: 15,
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