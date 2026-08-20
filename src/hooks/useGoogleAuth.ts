import { auth, db } from '@/lib/firebase';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

const WEB_CLIENT_ID = '781913153882-idve7g3jbgn2f77tr8nker1231uhq0fr.apps.googleusercontent.com';

export function useGoogleAuth() {
  useEffect(() => {
    console.log('[GoogleAuth] Configuring Google Sign-In');
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID, // must be the WEB client, not android/iOS
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[GoogleAuth] Checking Google Play Services');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('[GoogleAuth] Opening Google account picker');
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        console.log('[GoogleAuth] Missing ID token from Google response');
        Alert.alert('Google Sign-In Failed', 'No ID token returned from Google.');
        return null;
      }

      console.log('[GoogleAuth] Signing into Firebase with Google credential');
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log('[GoogleAuth] Firebase Google sign-in successful', { uid: user.uid });

      console.log('[GoogleAuth] Checking Firestore user profile for UID:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('[GoogleAuth] Creating new Firestore user profile with inactive subscription for Google user');
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          fullName: user.displayName || '',
          email: user.email || '',
          subscriptionStatus: 'inactive',
          createdAt: new Date().toISOString(),
        });
        console.log('[GoogleAuth] Created new user profile successfully');
      } else {
        console.log('[GoogleAuth] Existing Firestore user profile found:', userDoc.data());
      }

      return userCredential;
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleAuth] Google sign-in cancelled by user');
        return null;
      }

      const message = String(error?.message ?? 'Unable to sign in with Google.');
      console.log('[GoogleAuth] Google sign-in failed', { code: error?.code, message });
      const configurationError =
        message.toLowerCase().includes('non recoverable') ||
        message.includes('DEVELOPER_ERROR') ||
        error?.code === '10' ||
        error?.code === '12500';

      Alert.alert(
        'Google Sign-In Failed',
        configurationError
          ? 'Google Sign-In is not configured correctly for this build. Add the Firebase google-services.json/GoogleService-Info.plist files, configure their paths in app.json, then rebuild the native app.'
          : message
      );
      return null;
    }
  }, []);

  return { signInWithGoogle };
} 
