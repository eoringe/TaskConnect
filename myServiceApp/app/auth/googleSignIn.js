import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase-config';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

export default function useGoogleSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // Get your Expo slug
  const slug = Constants.expoConfig?.slug || 'myServiceApp';
  const username = Constants.expoConfig?.owner || 'oringe';

  // Use the original redirect URI format that works with Google Cloud Console
  const redirectUri = `https://auth.expo.io/@${username}/${slug}`;

  // Set up the Google Auth Request - only using web client ID for Expo Go
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Use only web client ID when in Expo Go
    clientId: '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com',
    // Original redirect URI that you've configured in Google Cloud Console
    redirectUri: redirectUri,
    scopes: ['profile', 'email'],
  });

  // Log request object on initialization
  useEffect(() => {
    console.log('[DEBUG] Auth request object:', JSON.stringify(request, null, 2));
    console.log('[DEBUG] Using redirect URI:', redirectUri);
  }, [request, redirectUri]);

  // Handle the authentication response
  const handleSignInResponse = async (responseObj) => {
    console.log('[DEBUG] Response received:', JSON.stringify(responseObj, null, 2));
    
    if (responseObj?.type === 'success') {
      setIsSigningIn(true);
      setError(null);

      try {
        console.log('[DEBUG] Auth successful!');
        
        // Get the ID token from the response
        const { id_token: idToken } = responseObj.params || {};
        
        if (!idToken) {
          console.error('[ERROR] No ID token in response');
          throw new Error('No ID token returned from Google');
        }
        
        console.log('[DEBUG] ID token received (length):', idToken.length);
        
        // Create a Firebase credential with just the ID token
        const credential = GoogleAuthProvider.credential(idToken);
        console.log('[DEBUG] Firebase credential created');
        
        // Sign in with Firebase using the credential
        console.log('[DEBUG] Attempting Firebase sign-in...');
        const userCredential = await signInWithCredential(auth, credential);
        
        console.log('[DEBUG] Firebase sign-in successful!');
        console.log('[DEBUG] User UID:', userCredential.user.uid);
        console.log('[DEBUG] User email:', userCredential.user.email);
        
        // Navigate to home screen
        router.push('/home');
      } catch (err) {
        console.error('[ERROR] Sign-in error:', err.message);
        console.error('[ERROR] Error code:', err.code);
        setError(err.message || 'Sign-in failed');
      } finally {
        setIsSigningIn(false);
      }
    } else if (responseObj?.type === 'error') {
      console.error('[ERROR] Google sign-in error:', responseObj.error);
      setError(responseObj.error?.message || 'Google Sign-In failed');
    } else if (responseObj?.type === 'dismiss') {
      console.log('[INFO] Google sign-in was dismissed');
      setError('Authentication was dismissed. Please try again.');
    } else if (responseObj?.type === 'cancel') {
      console.log('[INFO] Google sign-in was cancelled');
      setError('Authentication was cancelled. Please try again.');
    } else {
      console.log('[WARNING] Unexpected response type:', responseObj?.type);
      setError('Unexpected response from authentication provider');
    }
  };

  // Watch for response changes and handle them
  useEffect(() => {
    console.log('[DEBUG] Response changed:', response ? response.type : 'null');
    if (response) {
      handleSignInResponse(response);
    }
  }, [response]);

  const triggerSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      console.log('[DEBUG] Starting Google sign-in flow...');
      
      if (!request) {
        console.error('[ERROR] Request object is not ready yet');
        setError('Authentication request not ready. Try again in a moment.');
        setIsSigningIn(false);
        return;
      }
      
      console.log('[DEBUG] Opening auth URL:', request.url);
      
      // Important: Make sure useProxy is true for Expo Go
      const result = await promptAsync({ useProxy: true });
      
      console.log('[DEBUG] PromptAsync result:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('[ERROR] Error initiating sign-in:', err.message);
      setError(err.message || 'Failed to start sign-in');
      setIsSigningIn(false);
    }
  };

  return {
    isSigningIn,
    error,
    promptAsync: triggerSignIn
  };
}