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
    console.log('[Layout Auth] Subscribing to onIdTokenChanged');
    const unsub = onIdTokenChanged(auth, async (authUser) => {
      if (!authUser) {
        console.log('[Layout Auth] User signed out or no active auth user');
        setUser(null);
        setUserData(null);
        setChecking(false);
      } else {
        console.log('[Layout Auth] Authenticated user detected:', authUser.uid, authUser.email);
        setUser(authUser);
      }
      setAuthLoaded(true);
    });
    return unsub;
  }, []);

  // Listen to Firestore Profile Data when user is logged in
  useEffect(() => {
    if (!user) {
      console.log('[Layout Firestore] No logged in user, skipping snapshot listener');
      return;
    }

    console.log('[Layout Firestore] Subscribing to profile doc for user:', user.uid);
    const docUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && Object.keys(snap.data()).length > 0) {
        const data = snap.data();
        console.log('[Layout Firestore] Received user profile update:', data);
        setUserData(data);
      } else {
        console.log('[Layout Firestore] User doc missing or empty in Firestore');
        setUserData({});
      }
      setChecking(false);
    }, (err) => {
      console.error("[Layout Firestore] onSnapshot error:", err);
      setUserData((prev: any) => prev || {});
      setChecking(false);
    });

    return docUnsub;
  }, [user]);

  // Handle Protected Routes & Navigation Decisions
  // Guard runs only after BOTH auth is resolved AND the splash minimum timer is done
  useEffect(() => {
    if (!authLoaded || checking || !splashReady) {
      console.log('[Layout Navigation] Waiting for ready states:', { authLoaded, checking, splashReady });
      return;
    }

    const currentSegment = segments.join('/') || 'index';
    console.log('[Layout Navigation] Evaluating route guard for segment:', currentSegment, {
      userId: user?.uid,
      hasUserData: !!userData,
      businessName: userData?.businessName,
      subscriptionStatus: userData?.subscriptionStatus,
    });

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
        console.log('[Layout Navigation] Unauthenticated user accessing protected route. Redirecting to /login');
        router.replace('/login' as any);
      }
    } else {
      // Logged in — if on the index/welcome screen, let the user tap Continue themselves
      if (isIndexRoute) return;

      // Wait for Firestore profile to be fetched
      if (userData === null) {
        console.log('[Layout Navigation] Profile data is still loading');
        return;
      }

      const hasBusinessName = !!(userData.businessName && userData.businessName.trim());
      const subStatus = userData.subscriptionStatus || 'active';

      if (!hasBusinessName) {
        // User hasn't completed business info — only redirect if not already on onboarding/public
        if (!isBusinessInfoRoute) {
          console.log('[Layout Navigation] Missing businessName. Redirecting to /businessInfoScreen');
          router.replace('/businessInfoScreen' as any);
        }
      } else if (subStatus === 'pending') {
        // Subscription verification is pending
        if (!isPendingRoute) {
          console.log('[Layout Navigation] Subscription pending. Redirecting to /pendingScreen');
          router.replace('/pendingScreen' as any);
        }
      } else {
        // Active / Expired — send to tabs if currently on public or onboarding page
        if (!isInsideTabs && (isPublicRoute || isOnboardingRoute)) {
          console.log('[Layout Navigation] Setup complete with status:', subStatus, '. Redirecting to /(tabs)/home');
          router.replace('/(tabs)/home' as any);
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
