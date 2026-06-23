import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { GoogleMark } from '@/components/ui/google-mark';
import { Colors, Fonts } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function SignUpScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms of Services');
      return;
    }
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize the user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        fullName,
        email,
        subscriptionStatus: 'expired',
        createdAt: new Date().toISOString()
      });

      router.push('/businessInfoScreen');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Create Your Account - Sign Up with Google or Email for Quick Access!
              </Text>
            </View>

            <AppButton
              title="Continue with Google"
              variant="outline"
              icon={<GoogleMark />}
              style={styles.googleButton}
              onPress={signInWithGoogle}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.form}>
              <AppTextInput 
                placeholder="Full Name" 
                textContentType="name" 
                autoCapitalize="words" 
                value={fullName}
                onChangeText={setFullName}
              />
              <AppTextInput
                placeholder="Email/Phone number"
                keyboardType="email-address"
                textContentType="username"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <AppTextInput
                placeholder="Create Password"
                textContentType="newPassword"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((value) => !value)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? <View style={styles.checkboxDot} /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms of Services</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </Pressable>

            <AppButton 
              title={loading ? "Please wait..." : "Continue"} 
              style={styles.continueButton} 
              onPress={handleSignup}
              disabled={loading}
            />

            <Text style={styles.footerText}>
              Do you have an account?{' '}
              <Link href="/login" style={styles.footerLink}>
                Log In
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
    maxWidth: 285,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 24,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DAD8DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.brand.primary,
  },
  checkboxDot: {
    width: 13,
    height: 13,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
  },
  termsText: {
    flex: 1,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  linkText: {
    color: Colors.brand.primary,
  },
  continueButton: {
    marginTop: 26,
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
    fontWeight: '800',
  },
});
