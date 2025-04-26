// app/(tabs)/auth/signup.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../../firebase-config';
import BiometricHelper from '../home/utils/BiometricHelper';

const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  
  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [signupError, setSignupError] = useState('');
  
  // Check if biometric authentication is available
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await BiometricHelper.isBiometricAvailable();
      setIsBiometricAvailable(isAvailable);
      
      if (isAvailable) {
        const biometricName = BiometricHelper.getBiometricName();
        setBiometricType(biometricName);
      }
    } catch (error) {
      console.log('Error checking biometric availability:', error);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset previous errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSignupError('');
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email format is invalid');
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    
    return isValid;
  };

  const setupBiometricAuth = async (email: string, uid: string) => {
    if (enableBiometric && isBiometricAvailable) {
      try {
        // In a real app, you might store an auth token instead of the UID
        const success = await BiometricHelper.disableBiometric();
        if (!success) {
          console.log('Failed to enable biometric authentication');
          // We don't show an error here since it's not critical to account creation
        }
      } catch (error) {
        console.log('Error setting up biometric auth:', error);
      }
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSignupError('');
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Setup biometric authentication if enabled
      await setupBiometricAuth(email, userCredential.user.uid);
      
      console.log('User account created successfully!');
      
      // Set up a listener to ensure auth state is properly updated before navigation
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('User is authenticated, redirecting to home');
          router.replace('/home');
          unsubscribe(); // Remove the listener once we've navigated
        }
      });
      
      // Fallback if the auth state doesn't update within 2 seconds
      setTimeout(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Fallback: User is authenticated, redirecting to home');
          unsubscribe(); // Remove the listener
          router.replace('/home');
        } else {
          console.log('Fallback: User not authenticated after signup, trying login');
          unsubscribe(); // Remove the listener
          Alert.alert(
            'Account Created',
            'Your account has been created successfully. Please sign in now.',
            [
              { text: 'OK', onPress: () => router.replace('/auth/Login') }
            ]
          );
        }
      }, 2000);
    } catch (error: any) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error?.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error?.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      setSignupError(errorMessage);
      Alert.alert('Sign-Up Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => { 
    router.push('/auth/Login');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#5CBD6A', '#3C9D4E']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>TC</Text>
              </LinearGradient>
            </View>
            <Text style={styles.headerText}>Create Account</Text>
            <Text style={styles.subHeaderText}>Sign up to get started</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={[
              styles.inputContainer, 
              nameError ? styles.inputError : null
            ]}>
              <Ionicons name="person-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Email Input */}
            <View style={[
              styles.inputContainer, 
              emailError ? styles.inputError : null
            ]}>
              <Ionicons name="mail-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Password Input */}
            <View style={[
              styles.inputContainer,
              passwordError ? styles.inputError : null
            ]}>
              <Ionicons name="lock-closed-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Confirm Password Input */}
            <View style={[
              styles.inputContainer,
              confirmPasswordError ? styles.inputError : null
            ]}>
              <Ionicons name="lock-closed-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

            {/* Biometric Authentication Option */}
            {isBiometricAvailable && (
              <TouchableOpacity 
                style={styles.biometricOption}
                onPress={() => setEnableBiometric(!enableBiometric)}
                disabled={isLoading}
              >
                <View style={styles.biometricCheckbox}>
                  {enableBiometric && (
                    <Ionicons name="checkmark" size={16} color="#5CBD6A" />
                  )}
                </View>
                <Text style={styles.biometricText}>
                  Enable {biometricType} login
                </Text>
              </TouchableOpacity>
            )}

            {/* General signup error message */}
            {signupError ? <Text style={[styles.errorText, styles.generalError]}>{signupError}</Text> : null}

            {/* Sign Up Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleSignUp}
              disabled={isLoading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={['#5CBD6A', '#3C9D4E']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.signUpButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleGoToLogin}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 60,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 5,
  },
  generalError: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    color: '#fff',
    fontSize: 16,
  },
  passwordToggle: {
    padding: 8,
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  biometricCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#5CBD6A',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 189, 106, 0.1)',
  },
  biometricText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  buttonContainer: {
    marginTop: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  signUpButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  signInLink: {
    color: '#5CBD6A',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;