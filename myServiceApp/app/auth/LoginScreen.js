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
  codeInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#111',
  },
  codeInputHeaderContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textDecorationLine: 'underline',
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
  debugButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  }
});

const LoginScreen = () => {
  console.log('[LOGIN SCREEN] Rendering LoginScreen component');
  
  // Get Google Sign-in functionality from our custom hook
  const { 
    signIn, 
    isSigningIn, 
    error: googleSignInError, 
    waitingForManualReturn, 
    CodeInputComponent,
    checkAuthStatus,
    forceShowCodeInput,
    debugState,
    authCode,
    setAuthCode,
    handleCodeSubmit,
    renderTrigger // Use this to force re-renders
  } = useGoogleSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [localRenderKey, setLocalRenderKey] = useState(0); // Used for forcing re-renders

  // Force a re-render when needed
  const forceUpdate = () => {
    setLocalRenderKey(prev => prev + 1);
  };

  // Log whenever waitingForManualReturn changes
  useEffect(() => {
    console.log('[LOGIN SCREEN] waitingForManualReturn changed to:', waitingForManualReturn);
    if (waitingForManualReturn) {
      // Force a re-render when waitingForManualReturn becomes true
      forceUpdate();
    }
  }, [waitingForManualReturn]);

  // Also re-render when renderTrigger from the hook changes
  useEffect(() => {
    if (renderTrigger > 0) {
      console.log('[LOGIN SCREEN] renderTrigger changed, forcing update');
      forceUpdate();
    }
  }, [renderTrigger]);

  // Component mount and unmount logging
  useEffect(() => {
    console.log('[LOGIN SCREEN] Component mounted');
    
    // Debug state on mount
    if (debugState) {
      debugState();
    }
    
    return () => {
      console.log('[LOGIN SCREEN] Component unmounting');
    };
  }, []); 

  // Log auth status on mount
  useEffect(() => {
    const checkStatus = async () => {
      console.log('[LOGIN SCREEN] Checking auth status on mount');
      if (checkAuthStatus) {
        checkAuthStatus();
      }
    };
    
    checkStatus();
  }, [checkAuthStatus]);

  // Show error from Google Sign-In if it exists
  useEffect(() => {
    if (googleSignInError) {
      console.log('[LOGIN SCREEN] Google sign-in error:', googleSignInError);
      setLoginError(googleSignInError);
      Alert.alert('Sign-In Error', googleSignInError);
    }
  }, [googleSignInError]);

  // Log whenever isSigningIn changes
  useEffect(() => {
    console.log('[LOGIN SCREEN] isSigningIn changed to:', isSigningIn);
  }, [isSigningIn]);
  
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
    setLoginError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, navigate to home
      router.push('/home');
    } catch (error) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error && error.code === 'auth/user-not-found' || 
          error && error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password';
      } else if (error && error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      }
      
      setLoginError(errorMessage);
      Alert.alert('Sign-In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[LOGIN SCREEN] Google sign-in button pressed');
    setLoginError('');
    try {
      await signIn();
      console.log('[LOGIN SCREEN] Returned from signIn() call');
      
      // Debug the auth state after a short delay
      setTimeout(() => {
        if (debugState) {
          console.log('[LOGIN SCREEN] Checking state after sign-in call');
          debugState();
        }
      }, 1000);
    } catch (err) {
      console.error('[LOGIN SCREEN] Error handling Google sign-in:', err);
    }
  };
  
  const handleForceShowCodeInput = () => {
    console.log('[LOGIN SCREEN] Force showing code input');
    if (forceShowCodeInput) {
      forceShowCodeInput();
    }
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  console.log('[LOGIN SCREEN] Render state:', {
    waitingForManualReturn,
    isSigningIn,
    showCodeInput: !!CodeInputComponent,
    localRenderKey
  });

  // Create a custom code input component - this helps with proper rendering
  const renderCodeInput = () => {
    console.log('[LOGIN SCREEN] Rendering code input component, key:', localRenderKey);
    
    return (
      <View style={styles.codeInputWrapper} key={`code-input-${localRenderKey}`}>
        <View style={styles.codeInputHeaderContainer}>
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
          <Text style={styles.headerText}>Google Sign-In</Text>
          <Text style={styles.subHeaderText}>Enter the authentication code from the browser</Text>
        </View>
        
        {/* Use the CodeInputComponent directly */}
        <CodeInputComponent />
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.cancelButtonText}>Cancel Sign-In</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // We use key prop to force re-rendering when the state changes
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        key={`main-container-${localRenderKey}`}
      >
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Show the code input component if we're waiting for manual return */}
          {waitingForManualReturn ? (
            renderCodeInput()
          ) : (
            <>
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
                  onPress={handleForgotPassword}
                  disabled={isLoading || isSigningIn}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* General login error message */}
                {loginError ? <Text style={[styles.errorText, styles.generalError]}>{loginError}</Text> : null}

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
                    onPress={handleGoogleSignIn}
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
                
                {/* Debug Button - For Development Only */}
                {__DEV__ && (
                  <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={handleForceShowCodeInput}
                  >
                    <Text style={styles.debugButtonText}>Debug: Show Code Input</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity 
                  onPress={handleSignUp} 
                  disabled={isLoading || isSigningIn}
                >
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;