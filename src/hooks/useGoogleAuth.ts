import { auth, db } from '@/lib/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

/**
 * Replace this with your Web Client ID from:
 * Firebase Console → Authentication → Sign-in method → Google → Web client ID
 */
const WEB_CLIENT_ID = '781913153882-idve7g3jbgn2f77tr8nker1231uhq0fr.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [, , promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    // Uncomment and fill in for native (dev build) support:
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await promptAsync();

      if (result?.type !== 'success') return null;

      const { id_token } = result.params;

      if (!id_token) {
        Alert.alert('Google Sign-In Failed', 'No ID token returned from Google.');
        return null;
      }

      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Check if user profile already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // New Google user — initialize their profile
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          fullName: user.displayName || '',
          email: user.email || '',
          subscriptionStatus: 'expired',
          createdAt: new Date().toISOString(),
        });
      }

      return userCredential;
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message);
      return null;
    }
  }, [promptAsync]);

  return { signInWithGoogle };
}
