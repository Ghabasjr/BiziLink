// import { auth, db } from '@/lib/firebase';
// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { useCallback } from 'react';
// import { Alert } from 'react-native';

// WebBrowser.maybeCompleteAuthSession();

// /**
//  * Replace this with your Web Client ID from:
//  * Firebase Console → Authentication → Sign-in method → Google → Web client ID
//  */
// const WEB_CLIENT_ID = '781913153882-idve7g3jbgn2f77tr8nker1231uhq0fr.apps.googleusercontent.com';

// export function useGoogleAuth() {
//   const [, , promptAsync] = Google.useAuthRequest({
//     webClientId: WEB_CLIENT_ID,
//     // Uncomment and fill in for native (dev build) support:
//     androidClientId: '781913153882-s2j8m511221b2l699f8l518h49q2713r.apps.googleusercontent.com',
//     iosClientId: '781913153882-s2j8m511221b2l699f8l518h49q2713r.apps.googleusercontent.com',
//   });

//   const signInWithGoogle = useCallback(async () => {
//     try {
//       const result = await promptAsync();

//       if (result?.type !== 'success') return null;

//       const { id_token } = result.params;

//       if (!id_token) {
//         Alert.alert('Google Sign-In Failed', 'No ID token returned from Google.');
//         return null;
//       }

//       const credential = GoogleAuthProvider.credential(id_token);
//       const userCredential = await signInWithCredential(auth, credential);
//       const user = userCredential.user;

//       // Check if user profile already exists in Firestore
//       const userDoc = await getDoc(doc(db, 'users', user.uid));

//       if (!userDoc.exists()) {
//         // New Google user — initialize their profile
//         await setDoc(doc(db, 'users', user.uid), {
//           id: user.uid,
//           fullName: user.displayName || '',
//           email: user.email || '',
//           subscriptionStatus: 'expired',
//           createdAt: new Date().toISOString(),
//         });
//       }

//       return userCredential;
//     } catch (error: any) {
//       Alert.alert('Google Sign-In Failed', error.message);
//       return null;
//     }
//   }, [promptAsync]);

//   return { signInWithGoogle };
// }


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
