import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { auth, GoogleAuthProvider, signInWithCredential } from '../../firebase-config';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleSignIn() {
  const navigation = useNavigation(); // Get the navigation object
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com',
    androidClientId: '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com',
    iosClientId: '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com',
    webClientId: '249705110811-b5h6c9rb8i79uqug3tt5ficghcfk9o0d.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token', // Keep this if you want id_token for Firebase
    usePKCE: false,
  });

  useEffect(() => {
    console.log('📩 Google response:', response);

    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (!id_token) {
        console.error('❌ ID token missing from response.params');
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token);
      console.log('✅ Firebase credential:', credential);

      signInWithCredential(auth, credential)
        .then((userCredential) => {
          const { user } = userCredential;
          const isNewUser = userCredential.additionalUserInfo?.isNewUser;

          console.log('🎉 Firebase Sign-In Success:');
          console.log('👤 UID:', user.uid);
          console.log('📧 Email:', user.email);
          console.log('🧑 Name:', user.displayName);
          console.log('🆕 New user:', isNewUser);

          // Navigate to the Home screen after successful sign-in
          router.push('/home');
        })
        .catch((error) => {
          console.error('🔥 Firebase sign-in failed:', error);
        });
    } else if (response?.type === 'error') {
      console.error('🚫 Google Auth error:', response.error);
    }
  }, [response, navigation]); // Add navigation to the dependency array

  return { request, promptAsync };
}