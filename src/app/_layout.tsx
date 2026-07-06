import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { auth, db } from '@/lib/firebase';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [splashReady, setSplashReady] = useState(false); // true once the 3s splash finishes
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const segments = useSegments() as any;

  SplashScreen.preventAutoHideAsync().catch(() => { });

  // Called by AnimatedSplashOverlay when its minimum display time (3s) is up
  const handleSplashFinished = useCallback(() => {
    setSplashReady(true);
  }, []);


  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Listen to Auth State — use onIdTokenChanged so we also detect token expiry
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (authUser) => {
      if (!authUser) {
        // Token expired or user signed out — ensure clean sign-out
        try {
          await signOut(auth);
        } catch (_) {
          // already signed out, ignore
        }
        setUser(null);
        setUserData(null);
        setChecking(false);
      } else {
        setUser(authUser);
      }
      setAuthLoaded(true);
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
      if (snap.exists() && Object.keys(snap.data()).length > 0) {
        setUserData(snap.data());
      } else {
        // Doc missing or empty — treat as genuinely incomplete profile
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
  // Guard runs only after BOTH auth is resolved AND the splash minimum timer is done
  useEffect(() => {
    if (!authLoaded || checking || !splashReady) return;

    const isIndexRoute = segments.length === 0 || segments[0] === 'index';
    const isPublicRoute =
      isIndexRoute ||
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
      // Not logged in — redirect away from protected pages
      if (!isPublicRoute && !isOnboardingRoute) {
        router.replace('/login' as any);
      }
    } else {
      // Logged in — if on the index/welcome screen, let the user tap Continue themselves
      if (isIndexRoute) return;

      // Wait for Firestore profile to be fetched
      if (userData === null) return;

      const hasBusinessName = !!(userData.businessName && userData.businessName.trim());
      const subStatus = userData.subscriptionStatus;

      if (!hasBusinessName) {
        // User hasn't completed business info — only redirect if not already on onboarding/public
        if (!isOnboardingRoute && !isPublicRoute) {
          router.replace('/businessInfoScreen' as any);
        }
      } else if (subStatus === 'pending') {
        // Subscription verification is pending
        if (!isPendingRoute) {
          router.replace('/pendingScreen' as any);
        }
      } else if (subStatus === 'active') {
        // Fully active — send to tabs if on a public or onboarding page
        if (!isInsideTabs && (isPublicRoute || isOnboardingRoute)) {
          router.replace('/(tabs)/home' as any);
        }
      } else {
        // Expired / unpaid — redirect to reactivation flow, NOT straight into tabs
        if (!isBusinessRegisterRoute && !isInsideTabs) {
          router.replace('/businessRegisterScreen' as any);
        }
      }
    }
  }, [authLoaded, user, userData, segments, splashReady, checking]);

  // Show splash while auth is resolving OR while the 3s minimum hasn't elapsed
  if (checking || !splashReady) {
    return <AnimatedSplashOverlay onFinished={handleSplashFinished} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
