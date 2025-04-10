import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { auth } from '../../firebase-config';  // Adjust the import path as necessary
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',  // your client ID here
    androidClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',  // same as expoClientId
    iosClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',  // same as expoClientId
    webClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',  // same as expoClientId
  });

  // Log the redirect URI
  useEffect(() => {
    if (request) {
      console.log('Redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(userCredential => {
          console.log('User signed in:', userCredential.user);
        })
        .catch(error => {
          console.error('Firebase sign-in error:', error);
        });
    }
  }, [response]);

  return { request, promptAsync };
}
