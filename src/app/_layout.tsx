import { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const segments = useSegments() as any;

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setAuthLoaded(true);
      if (!authUser) {
        setChecking(false);
      }
    });
    return unsub;
  }, []);

  // Listen to Firestore Profile Data when user is logged in
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const docUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        setUserData({}); // Non-null empty object if user profile doesn't exist yet
      }
      setChecking(false);
    }, (err) => {
      console.error("onSnapshot layout error:", err);
      setUserData({});
      setChecking(false);
    });

    return docUnsub;
  }, [user]);

  // Handle Protected Routes & Navigation Decisions
  useEffect(() => {
    if (!authLoaded) return;

    // Define public/onboarding routes that do not require login
    const isPublicRoute =
      segments.length === 0 ||
      segments[0] === 'index' ||
      segments[0] === 'login' ||
      segments[0] === 'signup' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'store';

    const isBusinessInfoRoute = segments[0] === 'businessInfoScreen';
    const isBusinessRegisterRoute = segments[0] === 'BusinessRegisterScreen';
    const isAccountCreatedRoute = segments[0] === 'accountCreated';
    const isPendingRoute = segments[0] === 'pendingScreen';
    const isInsideTabs = segments[0] === '(tabs)';

    // Any onboarding screen that comes AFTER signup (don't redirect away from these)
    const isOnboardingRoute =
      isBusinessInfoRoute || isBusinessRegisterRoute || isAccountCreatedRoute;

    if (!user) {
      // Not logged in — redirect to /login only if they try to access a protected page
      if (!isPublicRoute && !isOnboardingRoute) {
        router.replace('/login' as any);
      }
    } else {
      // Logged in — wait for user profile data to be fetched from Firestore
      if (userData === null) return;

      const hasBusinessName = !!(userData.businessName && userData.businessName.trim());
      const subStatus = userData.subscriptionStatus;

      if (!hasBusinessName) {
        // User hasn't completed business info yet — only redirect if not already there
        if (!isOnboardingRoute) {
          router.replace('/businessInfoScreen' as any);
        }
      } else if (subStatus === 'pending') {
        // Subscription verification is pending
        if (!isPendingRoute) {
          router.replace('/pendingScreen' as any);
        }
      } else {
        // Fully registered — send to tabs only if on a public/landing page
        if (!isInsideTabs && (isPublicRoute || isOnboardingRoute)) {
          router.replace('/(tabs)/index' as any);
        }
      }
    }
  }, [authLoaded, user, userData, segments]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F9' }}>
        <ActivityIndicator size="large" color="#6B3FE7" />
      </View>
    );
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
