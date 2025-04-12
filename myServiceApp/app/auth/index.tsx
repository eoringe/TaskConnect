import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  SafeAreaView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import useGoogleSignIn from './googleSignIn';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from '../../firebase-config';

const LoginScreen = () => {
  const { promptAsync, isSigningIn, error } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Show error from Google Sign-In if it exists
  React.useEffect(() => {
    if (error) {
      Alert.alert('Sign-In Error', error);
    }
  }, [error]);

  const validateForm = () => {
    let isValid = true;
    
    // Reset previous errors
    setEmailError('');
    setPasswordError('');
    
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
    
    return isValid;
  };

  const handleEmailSignIn = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, navigate to home
      router.push('/home');
    } catch (error) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if ((error as { code: string }).code === 'auth/user-not-found' || (error as { code: string }).code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password';
      } else if ((error as { code: string }).code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      }
      
      Alert.alert('Sign-In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        
        <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.headerText}>Welcome Back</Text>
            <Text style={styles.subHeaderText}>Sign in to continue</Text>
          </View>

          <View style={styles.formContainer}>
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
                editable={!isLoading && !isSigningIn}
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
                editable={!isLoading && !isSigningIn}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading || isSigningIn}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="rgba(255,255,255,0.7)" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              disabled={isLoading || isSigningIn}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleEmailSignIn}
              disabled={isLoading || isSigningIn}
            >
              <LinearGradient
                colors={['#5CBD6A', '#3C9D4E']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social Login Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              {/* Google Login */}
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  (isLoading || isSigningIn) && styles.socialButtonDisabled
                ]}
                onPress={() => promptAsync()}
                disabled={isLoading || isSigningIn}
              >
                <View style={styles.socialButtonContent}>
                  {isSigningIn ? (
                    <ActivityIndicator color="#DB4437" size="small" />
                  ) : (
                    <FontAwesome name="google" size={20} color="#DB4437" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Facebook Login */}
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  (isLoading || isSigningIn) && styles.socialButtonDisabled
                ]}
                disabled={isLoading || isSigningIn}
              >
                <View style={styles.socialButtonContent}>
                  <FontAwesome name="facebook" size={20} color="#4267B2" />
                </View>
              </TouchableOpacity>

              {/* X (Twitter) Login */}
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  (isLoading || isSigningIn) && styles.socialButtonDisabled
                ]}
                disabled={isLoading || isSigningIn}
              >
                <View style={styles.socialButtonContent}>
                  <FontAwesome name="twitter" size={20} color="#1DA1F2" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity disabled={isLoading || isSigningIn}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 10, // Additional padding for Android
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
    marginTop: Platform.OS === 'ios' ? 80 : 90, // Increased top margin
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
    marginBottom: 8, // Reduced to make room for error text
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#5CBD6A',
    fontSize: 14,
  },
  signInButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  signUpText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  signUpLink: {
    color: '#5CBD6A',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default LoginScreen;