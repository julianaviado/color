import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../utils/firebase';
import { syncResultToFirebase } from '../utils/storage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function AuthScreen({ navigation, route }) {
  const { result, answers, mode: initialMode } = route.params;
  const [mode, setMode] = useState(initialMode ?? 'signup'); // 'signup' | 'login'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    setError('');

    // Firebase not configured — skip auth, go straight to results
    if (!firebaseEnabled) {
      navigation.replace('Main', { result });
      return;
    }

    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        await syncResultToFirebase(cred.user.uid, answers, result);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncResultToFirebase(cred.user.uid, answers, result);
      }
      navigation.replace('Main', { result });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(code) {
    const map = {
      'auth/email-already-in-use':  'An account with this email already exists.',
      'auth/invalid-email':          'Please enter a valid email address.',
      'auth/weak-password':          'Please choose a stronger password.',
      'auth/user-not-found':         'No account found with that email.',
      'auth/wrong-password':         'Incorrect password.',
      'auth/invalid-credential':     'Incorrect email or password.',
      'auth/network-request-failed': 'No internet connection.',
    };
    return map[code] ?? 'Something went wrong. Please try again.';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>

          <Text style={styles.wordmark}>hue garden</Text>
          <Text style={styles.heading}>
            {mode === 'signup' ? 'Create your\ncolour profile' : 'Welcome\nback'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'signup'
              ? 'Your results are saved and waiting for you.'
              : 'Sign in to see your colour analysis.'}
          </Text>

          {/* Form */}
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="First name (optional)"
              placeholderTextColor={COLORS.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signup' ? 'Reveal my season →' : 'Sign in →'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
              <Text style={styles.switchLink}>
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  back: {
    marginBottom: SPACING.xl,
  },
  backText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.accent,
    letterSpacing: 3,
    marginBottom: SPACING.lg,
  },
  heading: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '300',
    color: COLORS.textPrimary,
    lineHeight: 42,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  switchText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  switchLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  legal: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
