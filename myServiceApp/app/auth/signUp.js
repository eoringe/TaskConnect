import React, { useState, useRef } from 'react';
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
  ScrollView,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, sendEmailVerification, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'; 
import { auth } from '../../firebase-config';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig } from '../../firebase-config';

const SignUpScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // Default to US
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [signupError, setSignupError] = useState('');
  
  const [showOtpMethodModal, setShowOtpMethodModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  const countryOptions = [
    { code: '+1', label: '🇺🇸 US' },
    { code: '+254', label: '🇰🇪 KE' },
    { code: '+234', label: '🇳🇬 NG' },
    { code: '+44', label: '🇬🇧 UK' },
    { code: '+91', label: '🇮🇳 IN' },
  ];
  
  const recaptchaVerifier = useRef(null);
  
  const validateForm = () => {
    let isValid = true;
    
    // Reset previous errors
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSignupError('');
    
    // Validate first name
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }
    
    // Validate last name
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }
    
    // Validate phone
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
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

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setSignupError('');
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phone
      });
      // Send email verification
      await sendEmailVerification(userCredential.user);
      setShowEmailVerifyModal(true);
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error && error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (error && error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error && error.code === 'auth/weak-password') {
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

  const handleEmailVerification = async () => {
    setShowOtpMethodModal(false);
    setShowEmailVerifyModal(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send verification email.');
      setShowEmailVerifyModal(false);
    }
  };

  const handleContinueAfterEmail = async () => {
    setIsVerifying(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setShowEmailVerifyModal(false);
        router.replace('/home');
      } else {
        Alert.alert('Not Verified', 'Your email is not verified yet. Please check your inbox.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not verify email.');
    }
    setIsVerifying(false);
  };

  const handlePhoneVerification = async () => {
    setShowOtpMethodModal(false);
    setShowPhoneOtpModal(true);
    setOtp('');
    setOtpError('');
    try {
      // Set up invisible reCAPTCHA (web only, for native use expo-firebase-recaptcha)
      let appVerifier;
      if (typeof window !== 'undefined') {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
        }
        appVerifier = window.recaptchaVerifier;
      } else {
        // For native, skip reCAPTCHA (handled by Firebase natively)
        appVerifier = undefined;
      }
      const fullPhone = `${countryCode}${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (e) {
      Alert.alert('Error', 'Failed to send OTP.');
      setShowPhoneOtpModal(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setOtpError('');
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        // Now create the Firebase account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`,
          phoneNumber: phone
        });
        setShowPhoneOtpModal(false);
        router.replace('/home');
      } else {
        setOtpError('No OTP session found.');
      }
    } catch (e) {
      setOtpError('Invalid OTP or failed to create account. Please try again.');
    }
    setIsVerifying(false);
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
            {/* First Name Input */}
            <View style={[styles.inputContainer, firstNameError ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (firstNameError) setFirstNameError('');
                }}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}

            {/* Last Name Input */}
            <View style={[styles.inputContainer, lastNameError ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (lastNameError) setLastNameError('');
                }}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}

            {/* Country Code and Phone Number */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.inputContainer, phoneError ? styles.inputError : null, { flex: 1.8, marginRight: 8 }]}> 
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10 }}
                  onPress={() => setShowCountryDropdown(true)}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>{countryOptions.find(c => c.code === countryCode)?.label || countryCode}</Text>
                  <Ionicons name="chevron-down" size={18} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                {/* Country dropdown modal */}
                <Modal
                  visible={showCountryDropdown}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowCountryDropdown(false)}
                >
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: 250 }}>
                      {countryOptions.map(option => (
                        <TouchableOpacity
                          key={option.code}
                          style={{ paddingVertical: 10 }}
                          onPress={() => {
                            setCountryCode(option.code);
                            setShowCountryDropdown(false);
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>{option.label} ({option.code})</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </Modal>
              </View>
              <View style={[styles.inputContainer, phoneError ? styles.inputError : null, { flex: 3 }]}> 
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (phoneError) setPhoneError('');
                  }}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

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

      {/* OTP Method Selection Modal */}
      <Modal
        visible={showOtpMethodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpMethodModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>Choose Verification Method</Text>
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 24, textAlign: 'center' }}>
              Where should we send your verification code?
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#5CBD6A', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 16, width: '100%' }}
              onPress={handleEmailVerification}
            >
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>Send to Email ({email})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#3C9D4E', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 16, width: '100%' }}
              onPress={handlePhoneVerification}
            >
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>Send to Phone ({countryCode} {phone})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 8 }}
              onPress={() => setShowOtpMethodModal(false)}
            >
              <Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={showEmailVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailVerifyModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>Verify Your Email</Text>
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 24, textAlign: 'center' }}>
              We sent a verification link to {email}. Please check your inbox and click the link to verify your email.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#5CBD6A', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 8, width: '100%' }}
              onPress={handleContinueAfterEmail}
              disabled={isVerifying}
            >
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{isVerifying ? 'Checking...' : 'Continue'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 8 }}
              onPress={() => setShowEmailVerifyModal(false)}
            >
              <Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phone OTP Modal */}
      <Modal
        visible={showPhoneOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhoneOtpModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>Enter OTP</Text>
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 24, textAlign: 'center' }}>
              We sent a code to {countryCode} {phone}. Enter it below to verify your phone number.
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 18, width: '80%', marginBottom: 12, textAlign: 'center' }}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              editable={!isVerifying}
              maxLength={6}
            />
            {otpError ? <Text style={{ color: 'red', marginBottom: 8 }}>{otpError}</Text> : null}
            <TouchableOpacity
              style={{ backgroundColor: '#3C9D4E', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 8, width: '100%' }}
              onPress={handleVerifyOtp}
              disabled={isVerifying}
            >
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{isVerifying ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 8 }}
              onPress={() => setShowPhoneOtpModal(false)}
            >
              <Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
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