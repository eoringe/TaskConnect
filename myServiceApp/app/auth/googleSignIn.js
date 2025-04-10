import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { auth } from '../../firebase-config';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',
    androidClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',
    iosClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',
    webClientId: '945084869931-ciignb3148q0nufl6cnj6k25i2v86lbb.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token', // Keep this if you want id_token for Firebase
    usePKCE: false,
  });

  useEffect(() => {
    console.log('📩 Google response:', response);

    if (response?.type === 'success') {
      const id_token = response?.params?.id_token;

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
        })
        .catch((err) => {
          console.error('🔥 Firebase sign-in failed:', err);
        });
    } else if (response?.type === 'error') {
      console.error('🚫 Google Auth error:', response.error);
    }
  }, [response]);

  return { request, promptAsync };
}
