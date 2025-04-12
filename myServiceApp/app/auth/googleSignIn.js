import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState, useCallback } from 'react';
import { auth, GoogleAuthProvider, signInWithCredential } from '../../firebase-config';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Complete any authentication session with proper configuration
WebBrowser.maybeCompleteAuthSession({
  skipRedirectCheck: true,
});

export default function useGoogleSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);
  
  // Get platform-specific client ID
  const getClientId = () => {
    if (Platform.OS === 'ios') {
      return 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com'; // Replace with your iOS client ID
    } else if (Platform.OS === 'android') {
      return '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com'; // Replace with your Android client ID
    } else {
      return '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com'; // Web client ID
    }
  };

  // Determine correct redirect URI based on environment
  const getRedirectUri = () => {
    if (Constants.appOwnership === 'expo') {
      // Using Expo Go
      return `https://auth.expo.io/@oringe/myServiceApp`;
    } else {
      // Production builds should use scheme-based redirect
      const scheme = Constants.expoConfig?.scheme || 'myserviceapp';
      return `${scheme}://`;
    }
  };

  // Log environment info once
  useEffect(() => {
    console.log('[INIT] Platform:', Platform.OS);
    console.log('[INIT] App ownership:', Constants.appOwnership);
    console.log('[INIT] Client ID:', getClientId());
    console.log('[INIT] Redirect URI:', getRedirectUri());
  }, []);

  // Set up Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: getClientId(),
    redirectUri: getRedirectUri(),
    scopes: ['profile', 'email'],
    selectAccount: true,
    // Add prompt parameter to force account selection
    extraParams: {
      prompt: 'select_account',
      // Add state and nonce for security
      state: 'google-auth-state',
      nonce: 'google-auth-nonce',
    },
    usePKCE: true,
  });

  // Log request object changes
  useEffect(() => {
    if (request) {
      console.log('[REQUEST] Request object ready');
    } else {
      console.log('[REQUEST] Request object not ready');
    }
  }, [request]);

  // Handle Firebase sign-in
  const handleFirebaseSignIn = useCallback(async (idToken) => {
    try {
      console.log('[FIREBASE] Creating credential');
      const credential = GoogleAuthProvider.credential(idToken);
      
      console.log('[FIREBASE] Signing in with credential');
      const userCredential = await signInWithCredential(auth, credential);
      const { user } = userCredential;
      
      console.log('[FIREBASE] Sign-in successful, user:', user.email);
      
      // Navigate to home screen
      router.push('/home');
      return true;
    } catch (error) {
      console.error('[ERROR] Firebase sign-in failed:', error.code, error.message);
      setError(`Firebase sign-in failed: ${error.message}`);
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, []);
  
  // Handle Google Auth response
  useEffect(() => {
    if (!response) return;
    
    const handleResponse = async () => {
      console.log('[RESPONSE] Type:', response.type);
      
      if (response.type === 'success') {
        console.log('[SUCCESS] Authentication successful');
        setIsSigningIn(true);
        setError(null);
        
        // Log full response params for debugging
        console.log('[SUCCESS] Response params:', JSON.stringify(response.params));
        
        const { id_token } = response.params;
        if (!id_token) {
          console.error('[ERROR] ID token missing from response');
          setError('ID token missing from response');
          setIsSigningIn(false);
          return;
        }
        
        await handleFirebaseSignIn(id_token);
      } else if (response.type === 'error') {
        // Log complete error object for debugging
        console.error('[ERROR] Google Auth error:', JSON.stringify(response.error, null, 2));
        setError(`Google Sign-In failed: ${response.error?.message || 'Unknown error'}`);
        setIsSigningIn(false);
      } else if (response.type === 'dismiss') {
        console.log('[INFO] Authentication was dismissed by user');
        setIsSigningIn(false);
      }
    };
    
    handleResponse();
  }, [response, handleFirebaseSignIn]);
  
  // Trigger sign-in function
  const triggerSignIn = useCallback(async () => {
    try {
      if (isSigningIn) {
        console.log('[TRIGGER] Already signing in, ignoring request');
        return;
      }
      
      setIsSigningIn(true);
      setError(null);
      console.log('[TRIGGER] Starting Google sign-in flow');
      
      if (!request) {
        console.error('[ERROR] Request object not ready');
        setError('Authentication not ready. Please try again in a moment.');
        setIsSigningIn(false);
        return;
      }
      
      // Configure browser options based on environment
      const options = {
        // Only use proxy in Expo Go
        useProxy: Constants.appOwnership === 'expo',
        // Important: Use system browser for better compatibility
        createTask: true,
        // Prevent browser from sleeping
        showInRecents: true,
        // Prefer system browser when available
        preferEphemeralSession: false,
      };
      
      console.log('[TRIGGER] Opening auth browser with options:', JSON.stringify(options));
      await promptAsync(options);
      
    } catch (err) {
      console.error('[ERROR] Error initiating sign-in:', err.message);
      setError(`Failed to start sign-in: ${err.message}`);
      setIsSigningIn(false);
    }
  }, [request, promptAsync, isSigningIn]);
  
  return {
    isSigningIn,
    error,
    signIn: triggerSignIn,
    // Also expose the original promptAsync for advanced use cases
    promptAsync
  };
}