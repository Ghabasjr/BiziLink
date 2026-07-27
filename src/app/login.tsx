import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { GoogleMark } from '@/components/ui/google-mark';
import { Colors, Fonts } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { auth } from '@/lib/firebase';

export default function LoginScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    console.log('[Login] Email/password login submitted', { email: normalizedEmail });

    if (!normalizedEmail || !password) {
      console.log('[Login] Validation failed: missing email or password');
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      console.log('[Login] Signing in with Firebase');
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      console.log('[Login] Firebase login successful', { uid: userCredential.user.uid });
      Alert.alert('Login Successful', 'You have logged in successfully.', [
        {
          text: 'Continue',
          onPress: () => {
            console.log('[Login] Navigating to dashboard');
            router.replace('/(tabs)/home' as any);
          },
        },
      ]);
    } catch (error: any) {
      const message = error?.message ?? 'Unable to login. Please try again.';
      console.log('[Login] Login failed', { code: error?.code, message });
      Alert.alert('Login Failed', message);
    } finally {
      console.log('[Login] Login flow finished');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[Login] Google login submitted');
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result) {
        console.log('[Login] Google login successful', { uid: result.user.uid });
        Alert.alert('Login Successful', 'You have logged in successfully.', [
          {
            text: 'Continue',
            onPress: () => {
              console.log('[Login] Navigating to dashboard after Google login');
              router.replace('/(tabs)/home' as any);
            },
          },
        ]);
      } else {
        console.log('[Login] Google login did not return a user');
      }
    } catch (error: any) {
      const message = error?.message ?? 'Unable to login with Google. Please try again.';
      console.log('[Login] Google login failed', { code: error?.code, message });
      Alert.alert('Login Failed', message);
    } finally {
      console.log('[Login] Google login flow finished');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Login Your Account - Login with Google or Email for Quick Access!
              </Text>
            </View>

            <AppButton
              title="Continue with Google"
              variant="outline"
              icon={<GoogleMark />}
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.form}>
              <AppTextInput
                placeholder="Email/Phone number"
                keyboardType="email-address"
                textContentType="username"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <AppTextInput
                placeholder="Password"
                textContentType="password"
                secureTextEntry
                showSecureToggle
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <Link href="/forgot-password" style={styles.forgotText}>
              Forgot Password?
            </Link>

            <AppButton
              title={loading ? "Please wait..." : "Continue"}
              style={styles.continueButton}
              onPress={handleLogin}
              disabled={loading}
            />

            <Text style={styles.footerText}>
              Do you have an account?{' '}
              <Link href="/signup" style={styles.footerLink}>
                SignUp
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBFAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    gap: 11,
    marginBottom: 28,
  },
  title: {
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 292,
    color: '#A0A0A5',
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '500',
    textAlign: 'center',
  },
  googleButton: {
    borderRadius: 8,
    justifyContent: 'center',
    gap: 21,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 27,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E6EA',
  },
  dividerText: {
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    gap: 21,
  },
  forgotText: {
    marginTop: 27,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'right',
  },
  continueButton: {
    marginTop: 27,
  },
  footerText: {
    marginTop: 22,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.brand.primary,
  },
});
