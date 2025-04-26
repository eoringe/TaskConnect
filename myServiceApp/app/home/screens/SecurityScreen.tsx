// app/(tabs)/home/screens/SecurityScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth } from '@/firebase-config';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useTheme } from '@/app/context/ThemeContext';
import { useThemedStyles, createThemedStyles } from '@/app/hooks/useThemedStyles';
import StatusBarSpace from '@/app/components/StatusBarSpace';
import BiometricHelper from '../utils/BiometricHelper'; // Using the full path to your BiometricHelper


const SecurityScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = useThemedStyles(createSecurityStyles);
  
  // State variables
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  // Check if biometric authentication is available and its current status
  const checkBiometricStatus = async () => {
    try {
      // Check if device supports biometric authentication
      const isAvailable = await BiometricHelper.isBiometricAvailable();
      setIsBiometricAvailable(isAvailable);
      
      if (isAvailable) {
        // Get the biometric type (Face ID, Touch ID, or Fingerprint)
        const biometricName = BiometricHelper.getBiometricName();
        setBiometricType(biometricName);
        
        // Check if user has enabled biometric authentication
        const isEnabled = await BiometricHelper.isBiometricEnabled();
        setIsBiometricEnabled(isEnabled);
      }
    } catch (error) {
      console.log('Error checking biometric status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Security settings options
  const securityOptions: Array<{
    icon: "key-outline" | "finger-print-outline" | "shield-checkmark-outline" | "lock-closed-outline" | "eye-off-outline" | "list-outline";
    title: string;
    description: string;
    action: string | ((value: boolean) => void);
    toggle?: boolean;
    state?: boolean;
    disabled?: boolean;
  }> = [
    { 
      icon: 'key-outline', 
      title: 'Change Password', 
      description: 'Update your account password',
      action: 'changePassword' 
    },
    { 
      icon: 'finger-print-outline', 
      title: `${biometricType} Authentication`, 
      description: `Use ${biometricType.toLowerCase()} to log in securely`,
      toggle: true,
      state: isBiometricEnabled,
      action: toggleBiometric,
      disabled: !isBiometricAvailable
    },
    { 
      icon: 'shield-checkmark-outline', 
      title: 'Two-Factor Authentication', 
      description: 'Add an extra layer of security',
      action: 'enableTwoFactor' 
    },
    { 
      icon: 'lock-closed-outline', 
      title: 'App Lock', 
      description: 'Require authentication when opening the app',
      action: 'appLock' 
    },
    { 
      icon: 'eye-off-outline', 
      title: 'Privacy Settings', 
      description: 'Manage your data and privacy options',
      action: 'privacySettings' 
    },
    { 
      icon: 'list-outline', 
      title: 'Login History', 
      description: 'View your recent login activities',
      action: 'loginHistory' 
    },
  ];

  // Function to toggle biometric authentication
  async function toggleBiometric(value: boolean) {
    if (!isBiometricAvailable) {
      Alert.alert(
        'Not Available',
        `${biometricType} is not available on this device or not configured.`
      );
      return;
    }

    if (value) {
      // Enable biometric authentication
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'User information not available');
        return;
      }

      // For existing users, prompt for their password to verify identity
      promptForPasswordVerification(user.email);
    } else {
      // Disable biometric authentication
      try {
        const success = await BiometricHelper.disableBiometric();
        if (success) {
          setIsBiometricEnabled(false);
          Alert.alert(
            'Biometric Login Disabled', 
            'Biometric authentication has been disabled.'
          );
        } else {
          Alert.alert(
            'Error', 
            'Failed to disable biometric authentication. Please try again.'
          );
        }
      } catch (error) {
        console.log('Error disabling biometric auth:', error);
        Alert.alert('Error', 'Failed to disable biometric authentication');
      }
    }
  }
  
  // Prompt for password verification before enabling biometrics
  const promptForPasswordVerification = (email: string) => {
    setVerificationEmail(email);
    setVerificationPassword('');
    setPasswordError('');
    setShowPasswordDialog(true);
  };
  
  // Handle password verification and store credentials for biometric login
  const handlePasswordVerification = async () => {
    if (!verificationPassword) {
      setPasswordError('Password is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create credential with the user's email and password
      const credential = EmailAuthProvider.credential(verificationEmail, verificationPassword);
      
      // Reauthenticate the user with Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not logged in');
      }
      
      // This verifies that the password is correct
      await reauthenticateWithCredential(user, credential);
      
      // Close the dialog
      setShowPasswordDialog(false);
      
      // If reauthentication is successful, store the ACTUAL password for biometric login
      // This way, we can use it later to authenticate with Firebase
      const success = await BiometricHelper.storeCredentials(
        verificationEmail, 
        verificationPassword  // Store the actual password
      );
      
      if (success) {
        setIsBiometricEnabled(true);
        Alert.alert(
          'Biometric Login Enabled', 
          `You can now use ${biometricType} to log in next time.`
        );
      } else {
        throw new Error('Failed to enable biometric authentication');
      }
    } catch (error) {
      console.log('Verification error:', error);
      if ((error as { code?: string }).code === 'auth/wrong-password') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError('Failed to verify identity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAction = (action: string) => {
    switch (action) {
      case 'changePassword':
        router.push('/home/screens/ChangePasswordScreen');
        break;
      case 'enableTwoFactor':
        router.push('/home/screens/TwoFactorAuthScreen');
        break;
      case 'appLock':
        Alert.alert('Coming Soon', 'App Lock will be available in a future update.');
        break;
      case 'privacySettings':
        Alert.alert('Coming Soon', 'Privacy Settings will be available in a future update.');
        break;
      case 'loginHistory':
        Alert.alert('Coming Soon', 'Login History will be available in a future update.');
        break;
      default:
        break;
    }
  };
  
  return (
    <View style={styles.container}>

      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionDescription}>
          Manage your account security settings and protect your personal information
        </Text>
        
        {securityOptions.map((option, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.securityOption,
              option.disabled ? styles.disabledOption : null
            ]}
            onPress={() => typeof option.action === 'string' ? handleAction(option.action) : null}
            disabled={option.toggle || option.disabled}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons 
                name={option.icon} 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            
            {option.toggle ? (
              <Switch
                value={option.state}
                onValueChange={(value) => {
                  if (typeof option.action === 'function') {
                    option.action(value);
                  }
                }}
                disabled={option.disabled}
                thumbColor={option.state ? theme.colors.primary : '#f4f3f4'}
                trackColor={{ 
                  false: '#767577', 
                  true: `${theme.colors.primary}80`
                }}
                ios_backgroundColor="#3e3e3e"
              />
            ) : (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.textLight} 
              />
            )}
          </TouchableOpacity>
        ))}
        
        <View style={styles.securityTipsContainer}>
          <Text style={styles.securityTipsTitle}>Security Tips</Text>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>Use a strong, unique password that includes numbers, symbols, and both uppercase and lowercase letters.</Text>
          </View>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>Enable two-factor authentication for an additional layer of security.</Text>
          </View>
          <View style={styles.securityTip}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>Regularly check your login history for any suspicious activity.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Password Verification Modal */}
      <Modal
        visible={showPasswordDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Your Identity</Text>
              <Text style={styles.modalSubtitle}>
                Please enter your password to enable {biometricType} authentication
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={[
                styles.inputContainer,
                passwordError ? styles.inputError : null
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={22} 
                  color={theme.colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Your password"
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry={true}
                  value={verificationPassword}
                  onChangeText={(text) => {
                    setVerificationPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  autoCapitalize="none"
                />
              </View>
              
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordDialog(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handlePasswordVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createSecurityStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  disabledOption: {
    opacity: 0.6,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  securityTipsContainer: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: theme.colors.card,
    padding: 16,
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
  securityTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  securityTip: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: theme.colors.error || '#FF6B6B',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: theme.colors.text,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.error || '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    padding: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}));

export default SecurityScreen;