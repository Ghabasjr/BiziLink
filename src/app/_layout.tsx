import { Stack, router, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { auth, db } from '@/lib/firebase';

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
  // useEffect(() => {
  //   if (!user) {
  //     // eslint-disable-next-line react-hooks/set-state-in-effect
  //     setUserData(null);
  //     return;
  //   }

  //   const docUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
  //     if (snap.exists()) {
  //       setUserData(snap.data());
  //     } else {
  //       setUserData({}); // Non-null empty object if user profile doesn't exist yet
  //     }
  //     setChecking(false);
  //   }, (err) => {
  //     console.error("onSnapshot layout error:", err);
  //     setUserData({});
  //     setChecking(false);
  //   });

  //   return docUnsub;
  // }, [user]);


  // Listen to Firestore Profile Data when user is logged in
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const docUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && Object.keys(snap.data()).length > 0) {
        setUserData(snap.data());
      } else {
        // Doc missing or empty — treat as genuinely incomplete profile,
        // but only after we're sure the snapshot has settled.
        setUserData({});
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
  // useEffect(() => {
  //   if (!authLoaded) return;

  // Handle Protected Routes & Navigation Decisions
  useEffect(() => {
    if (!authLoaded || checking) return;

    // Define public/onboarding routes that do not require login
    const isPublicRoute =
      segments.length === 0 ||
      segments[0] === 'index' ||
      segments[0] === 'login' ||
      segments[0] === 'signup' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'store';

    const isBusinessInfoRoute = segments[0] === 'businessInfoScreen';
    const isBusinessRegisterRoute = segments[0] === 'businessRegisterScreen';
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

      // if (!hasBusinessName) {
      //   // User hasn't completed business info yet — only redirect if not already there
      //   if (!isOnboardingRoute) {
      //     router.replace('/businessInfoScreen' as any);
      //   }

      if (!hasBusinessName) {
        // Only redirect to businessInfoScreen if the user is NOT on any public/signup
        // route OR onboarding route — prevents cold-start auto-redirects for new signups
        if (!isOnboardingRoute && !isPublicRoute) {
          router.replace('/businessInfoScreen' as any);
        }
      } else if (subStatus === 'pending') {
        // Subscription verification is pending
        if (!isPendingRoute) {
          router.replace('/pendingScreen' as any);
        }
      } else if (subStatus === 'active') {
        // Fully registered — send to tabs if on public or onboarding page
        if (!isInsideTabs && (isPublicRoute || isOnboardingRoute)) {
          router.replace('/(tabs)/home' as any);
        }
      } else {
        // Expired/unpaid — redirect to tabs only if they are on a public route (like index or login)
        // This lets them stay on businessRegisterScreen onboarding without being redirected to tabs automatically
        if (!isInsideTabs && isPublicRoute) {
          router.replace('/(tabs)/home' as any);
        }
      }
    }
  }, [authLoaded, user, userData, segments]);

  // if (checking) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F9' }}>
  //       <ActivityIndicator size="large" color="#6B3FE7" />
  //     </View>
  //   );
  // }

  // return (
  //   <>
  //     <AnimatedSplashOverlay />
  //     <Stack screenOptions={{ headerShown: false }} />
  //   </>
  // );

  if (checking) {
    return <AnimatedSplashOverlay />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
