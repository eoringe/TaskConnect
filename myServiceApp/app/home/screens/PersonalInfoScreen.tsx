// app/(tabs)/home/screens/PersonalInfoScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth } from '@/firebase-config';
import { 
  getUserProfile, 
  updateUserProfile, 
  UserProfile 
} from '@/app/services/userDatabaseService';

const PersonalInfoScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<Partial<UserProfile>>({
    displayName: '',
    email: '',
    phoneNumber: '',
    userType: ''
  });
  
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view this page.');
        router.back();
        return;
      }
      
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        setUserData({
          displayName: userProfile.displayName || user.displayName || '',
          email: userProfile.email || user.email || '',
          phoneNumber: userProfile.phoneNumber || user.phoneNumber || '',
          userType: userProfile.userType || ''
        });
      } else {
        // Use auth data if Firestore document doesn't exist
        setUserData({
          displayName: user.displayName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          userType: ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveUserData = async () => {
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update your profile.');
        return;
      }
      
      // Update user profile using our service
      await updateUserProfile({
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        userType: userData.userType,
        // Don't update email here as it requires special auth methods
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'Changing your email requires verification. Would you like to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => Alert.alert('Feature', 'Email change functionality will be implemented soon.')
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5CBD6A" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (editMode) {
                Alert.alert(
                  'Discard Changes',
                  'Are you sure you want to discard your changes?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', onPress: () => {
                      setEditMode(false);
                      loadUserData();
                    }}
                  ]
                );
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              if (editMode) {
                saveUserData();
              } else {
                setEditMode(true);
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#5CBD6A" />
            ) : (
              <Text style={styles.editButtonText}>{editMode ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={userData.displayName}
                onChangeText={(text) => setUserData({...userData, displayName: text})}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.infoValue}>{userData.displayName || 'Not set'}</Text>
            )}
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.infoValue}>{userData.email}</Text>
              {editMode && (
                <TouchableOpacity onPress={handleChangeEmail}>
                  <Text style={styles.changeEmailText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={userData.phoneNumber}
                onChangeText={(text) => setUserData({...userData, phoneNumber: text})}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{userData.phoneNumber || 'Not set'}</Text>
            )}
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User Type</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={userData.userType}
                onChangeText={(text) => setUserData({...userData, userType: text})}
                placeholder="Enter user type"
              />
            ) : (
              <Text style={styles.infoValue}>{userData.userType || 'Not set'}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity 
            style={styles.securityItem}
            onPress={() => Alert.alert('Feature', 'Password change functionality will be implemented soon.')}
          >
            <View style={styles.securityItemLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#555" style={styles.securityIcon} />
              <Text style={styles.securityText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.securityItem}
            onPress={() => Alert.alert('Feature', 'Two-factor authentication will be implemented soon.')}
          >
            <View style={styles.securityItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#555" style={styles.securityIcon} />
              <Text style={styles.securityText}>Two-Factor Authentication</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={() => Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Feature', 'Account deletion will be implemented soon.') }
            ]
          )}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#5CBD6A',
    minWidth: 70,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeEmailText: {
    color: '#5CBD6A',
    fontWeight: '600',
    fontSize: 14,
  },
  securitySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    marginRight: 15,
  },
  securityText: {
    fontSize: 16,
    color: '#333',
  },
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  deleteAccountText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalInfoScreen;