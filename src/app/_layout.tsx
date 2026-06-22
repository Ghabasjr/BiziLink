import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let docUnsub: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, (user) => {
      if (docUnsub) {
        docUnsub();
        docUnsub = null;
      }

      if (!user) {
        // Not logged in — send to onboarding/login
        router.replace('/login' as any);
        setChecking(false);
      } else {
        // Logged in — check if business info was filled and watch status in real-time
        try {
          docUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (!snap.exists() || !snap.data()?.businessName) {
              router.replace('/businessInfoScreen' as any);
            } else {
              const data = snap.data();
              if (data?.subscriptionStatus === 'pending') {
                router.replace('/pendingScreen' as any);
              } else {
                router.replace('/(tabs)/index' as any);
              }
            }
            setChecking(false);
          }, (err) => {
            console.error("onSnapshot layout error:", err);
            router.replace('/(tabs)/index' as any);
            setChecking(false);
          });
        } catch {
          router.replace('/(tabs)/index' as any);
          setChecking(false);
        }
      }
    });

    return () => {
      unsub();
      if (docUnsub) docUnsub();
    };
  }, []);

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
