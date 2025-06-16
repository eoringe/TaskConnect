// app/(tabs)/home/screens/TaskerProfileScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '@/firebase-config'; // Adjust path as needed for your project structure
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
// Removed StatusBarSpace import as it was commented out in usage and not imported in your last provided code.

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Re-using types from your previous onboarding screens
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
  id: string; // Unique ID for the service, maybe a UUID
  category: string;
  title: string;
  rate: string;
  description: string;
  isCustom?: boolean;
  taskerId?: string; // Added to include UID in serviceCategory
};

type ServicesData = {
  services: Service[];
};

type SupportingDocument = {
  id: string;
  uri: string; // This might be a local URI from image picker, or a base64 string
  name: string;
  description: string;
  mimeType: string;
  base64: string; // Crucial for storing the actual document data
};

type ProfileFormData = {
  profileImageBase64: string | null;
  bio: string;
};

type AllOnboardingData = PersonalDetails & IDVerificationFormData & AreasServedFormData & ServicesData & {
  supportingDocuments: SupportingDocument[];
  profileImageBase64: string | null;
  bio: string;
  onboardingStatus: 'pendingVerification' | 'completed';
  submissionDate?: string;
};


const TaskerProfileScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(createTaskerProfileStyles);

  const [taskerData, setTaskerData] = useState<AllOnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingServices, setIsUpdatingServices] = useState(false);

  // State for adding new service
  const [isAddServiceModalVisible, setIsAddServiceModalVisible] = useState(false);
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  useEffect(() => {
    fetchTaskerData();
  }, []);

  const fetchTaskerData = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('User not logged in.');
      setLoading(false);
      Alert.alert('Authentication Required', 'Please log in to view your tasker profile.', [
        { text: 'OK', onPress: () => router.replace('/auth/Login') }
      ]);
      return;
    }

    try {
      const docRef = doc(db, 'taskers', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTaskerData(docSnap.data() as AllOnboardingData);
      } else {
        setError('Tasker profile not found. Please complete the onboarding process.');
        Alert.alert('Profile Missing', 'Your tasker profile was not found. Please complete the onboarding process.', [
          { text: 'Go to Onboarding', onPress: () => router.replace('/tasker-onboarding/personal-details') }
        ]);
      }
    } catch (err: any) {
      console.error("Error fetching tasker data:", err);
      setError(`Failed to load profile: ${err.message || 'Unknown error'}`);
      Alert.alert('Error', `Failed to load profile: ${err.message || 'Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const base64ToImageSource = (base64String: string | null) => {
    if (!base64String) return undefined;
    // Add the data URI prefix if it's not already there
    return { uri: `data:image/jpeg;base64,${base64String}` };
  };

  const handleAddService = async () => {
    if (!newServiceCategory.trim() || !newServiceTitle.trim() || !newServiceRate.trim()) {
      Alert.alert('Missing Information', 'Please fill in category, title, and rate for the new service.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Authentication Error', 'You must be logged in to add services.');
      return;
    }

    setIsUpdatingServices(true);
    const newService: Service = {
      id: Date.now().toString(), // Simple unique ID
      category: newServiceCategory.trim(),
      title: newServiceTitle.trim(),
      rate: newServiceRate.trim(),
      description: newServiceDescription.trim(),
      taskerId: currentUser.uid, // Crucial for identifying the tasker
      isCustom: true, // Mark as custom if added by the tasker later
    };

    try {
      // 1. Update the 'taskers' document with the new service
      const taskerDocRef = doc(db, 'taskers', currentUser.uid);
      await updateDoc(taskerDocRef, {
        services: arrayUnion(newService)
      });

      // 2. Update the 'serviceCategories' collection
      const categoryDocRef = doc(db, 'serviceCategories', newService.category);
      await updateDoc(categoryDocRef, {
        services: arrayUnion(newService)
      });


      setTaskerData(prevData => ({
        ...(prevData as AllOnboardingData),
        services: [...((prevData?.services || [])), newService]
      }));

      Alert.alert('Success', 'Service added successfully!');
      setIsAddServiceModalVisible(false);
      setNewServiceCategory('');
      setNewServiceTitle('');
      setNewServiceRate('');
      setNewServiceDescription('');
    } catch (err: any) {
      console.error("Error adding service:", err);
      Alert.alert('Error', `Failed to add service: ${err.message || 'Please try again.'}`);
    } finally {
      setIsUpdatingServices(false);
    }
  };

  const handleDeleteService = async (serviceToDelete: Service) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Authentication Error', 'You must be logged in to delete services.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the service "${serviceToDelete.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUpdatingServices(true);
            try {
              // 1. Remove from 'taskers' document
              const taskerDocRef = doc(db, 'taskers', currentUser.uid);
              await updateDoc(taskerDocRef, {
                services: arrayRemove(serviceToDelete)
              });

              // 2. Remove from 'serviceCategories' collection
              const categoryDocRef = doc(db, 'serviceCategories', serviceToDelete.category);
              await updateDoc(categoryDocRef, {
                services: arrayRemove(serviceToDelete)
              });

              setTaskerData(prevData => ({
                ...(prevData as AllOnboardingData),
                services: (prevData?.services || []).filter(s => s.id !== serviceToDelete.id)
              }));

              Alert.alert('Success', 'Service deleted successfully!');
            } catch (err: any) {
              console.error("Error deleting service:", err);
              Alert.alert('Error', `Failed to delete service: ${err.message || 'Please try again.'}`);
            } finally {
              setIsUpdatingServices(false);
            }
          }
        },
      ]
    );
  };

  // Content for the ListHeaderComponent - MUST be called unconditionally
  const renderHeaderContent = useMemo(() => {
    // Only render if taskerData is available
    if (!taskerData) {
      return null;
    }

    return (
      <View style={styles.listHeaderContainer}>
        {/* Profile Image and Basic Info */}
        <View style={styles.profileSummary}>
          {taskerData.profileImageBase64 ? (
            <Image
              source={base64ToImageSource(taskerData.profileImageBase64)}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImagePlaceholderText}>
                {taskerData.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{taskerData.firstName} {taskerData.lastName}</Text>
          <Text style={styles.email}>{taskerData.email}</Text>
          <Text style={styles.phone}>{taskerData.phone}</Text>
        </View>

        {/* Professional Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Bio</Text>
          <Text style={styles.bioText}>{taskerData.bio || 'No bio provided yet.'}</Text>
        </View>

        {/* ID Verification Details (ID photos removed) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ID Verification</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>KRA PIN:</Text>
            <Text style={styles.detailValue}>{taskerData.kraPin || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID Number:</Text>
            <Text style={styles.detailValue}>{taskerData.idNumber || 'N/A'}</Text>
          </View>
        </View>

        {/* Areas Served */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Areas Served</Text>
          <Text style={styles.areasServedText}>
            {taskerData.areasServed && taskerData.areasServed.length > 0
              ? taskerData.areasServed.join(', ')
              : 'No areas specified.'}
          </Text>
        </View>
      </View>
    );
  }, [taskerData, theme.colors]); // Added theme.colors to dependency array for style changes

  // Combine data for the main FlatList (services and documents sections)
  const flatListData = useMemo(() => {
    const data: Array<{ type: string, id: string, item?: any, documents?: SupportingDocument[] }> = [];

    // Only add service/document related items if taskerData is available
    if (taskerData) {
      // Services Section
      data.push({ type: 'servicesSection', id: 'servicesSection', item: taskerData.services });
      data.push({ type: 'addServiceButton', id: 'addServiceButton' });

      // Documents Section (now grouped)
      data.push({ type: 'documentsSection', id: 'documentsSection', documents: taskerData.supportingDocuments });
    }

    return data;
  }, [taskerData]); // Re-compute if taskerData changes

  const renderItem = ({ item }: { item: { type: string, item?: any, id: string, documents?: SupportingDocument[] } }) => {
    switch (item.type) {
      case 'servicesSection':
        const services = item.item as Service[];
        return (
          <View style={[styles.section, { marginHorizontal: 16 }]}>
            <Text style={styles.sectionHeader}>Your Services</Text>
            {services && services.length > 0 ? (
              services.map(service => (
                <View key={service.id} style={[styles.serviceItem, { marginBottom: 10 }]}>
                  <View style={styles.serviceItemContent}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceCategory}>Category: {service.category}</Text>
                    <Text style={styles.serviceRate}>Rate: {service.rate}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteService(service)}
                    style={styles.deleteServiceButton}
                    disabled={isUpdatingServices}
                  >
                    {isUpdatingServices ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>No services added yet.</Text>
            )}
          </View>
        );
      case 'addServiceButton':
        return (
          <TouchableOpacity
            style={[styles.addServiceButton, { marginHorizontal: 16 }]}
            onPress={() => setIsAddServiceModalVisible(true)}
            disabled={isUpdatingServices}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addServiceButtonText}>Add New Service</Text>
          </TouchableOpacity>
        );
      case 'documentsSection':
        const supportingDocuments = item.documents as SupportingDocument[];
        return (
          <View style={[styles.section, { marginHorizontal: 16 }]}>
            <Text style={styles.sectionHeader}>Supporting Documents</Text>
            {supportingDocuments && supportingDocuments.length > 0 ? (
              supportingDocuments.map(document => (
                <View key={document.id} style={[styles.documentItem, { marginBottom: 10 }]}>
                  <Ionicons name="document-text-outline" size={24} color={theme.colors.textSecondary} style={styles.documentIcon} />
                  <View>
                    <Text style={styles.documentName}>{document.name}</Text>
                    <Text style={styles.documentDescription}>{document.description}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDocumentsText}>No supporting documents provided.</Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* <StatusBarSpace /> */}
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Tasker Profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* <StatusBarSpace /> */}
        <Ionicons name="alert-circle-outline" size={50} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTaskerData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!taskerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* <StatusBarSpace /> */}
        <Text style={styles.errorText}>No tasker data found.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/tasker-onboarding/personal-details')}>
          <Text style={styles.retryButtonText}>Go to Onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <StatusBarSpace /> */}

      <FlatList
        data={flatListData}
        // Ensure unique keys for FlatList items using the 'id' property we added
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeaderContent}
        contentContainerStyle={styles.flatListContentContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Service Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddServiceModalVisible}
        onRequestClose={() => setIsAddServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Service</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Category (e.g., Plumbing, Cleaning)"
              placeholderTextColor={theme.colors.textLight}
              value={newServiceCategory}
              onChangeText={setNewServiceCategory}
              editable={!isUpdatingServices}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Service Title (e.g., Fix leaky faucet)"
              placeholderTextColor={theme.colors.textLight}
              value={newServiceTitle}
              onChangeText={setNewServiceTitle}
              editable={!isUpdatingServices}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Rate (e.g., KES 1500/hr, KES 5000/job)"
              placeholderTextColor={theme.colors.textLight}
              value={newServiceRate}
              onChangeText={setNewServiceRate}
              keyboardType="default"
              editable={!isUpdatingServices}
            />
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textLight}
              value={newServiceDescription}
              onChangeText={setNewServiceDescription}
              multiline
              editable={!isUpdatingServices}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsAddServiceModalVisible(false)}
                disabled={isUpdatingServices}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalAddButton]}
                onPress={handleAddService}
                disabled={isUpdatingServices}
              >
                {isUpdatingServices ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Add Service</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createTaskerProfileStyles = createThemedStyles(theme => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatListContentContainer: {
    paddingBottom: 50,
  },
  listHeaderContainer: {
    padding: 16,
    paddingBottom: 0, // Ensure no padding at the bottom here, as individual sections will have marginBottom
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileSummary: {
    alignItems: 'center',
    marginBottom: 30, // Keep this margin to separate from the next section
    padding: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: theme.colors.border,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: theme.colors.border,
  },
  profileImagePlaceholderText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20, // Add margin to separate from the next section/item in the FlatList
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.text,
  },
  areasServedText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // Use background color for inner items
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  serviceItemContent: {
    flex: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  serviceCategory: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  serviceRate: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primary,
    marginTop: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  deleteServiceButton: {
    padding: 8,
    borderRadius: 20,
  },
  noServicesText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 10, // Reduced padding as it's inside a section now
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 20,
    gap: 10,
  },
  addServiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // Use background color for inner items
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  documentIcon: {
    marginRight: 10,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  documentDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  noDocumentsText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 10, // Reduced padding as it's inside a section now
    marginBottom: 0, // No extra margin if it's the last item in the section
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  modalAddButton: {
    backgroundColor: theme.colors.primary,
  },
  modalCancelButton: {
    backgroundColor: theme.colors.textLight,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}));

export default TaskerProfileScreen;