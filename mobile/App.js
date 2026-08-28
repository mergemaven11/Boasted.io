import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Brandmark from './src/Brandmark';
import { apiBaseURL } from './src/api';
import {
  getAuthErrorMessage,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  restoreSession,
} from './src/authApi';
import {
  createPrivateEntry,
  getProductErrorMessage,
  loadProofOverview,
  updateProfile,
} from './src/productApi';
import { colors, navigationTheme, radius } from './src/theme';

const Tab = createBottomTabNavigator();
const icons = { Home: '⌂', Proof: '✓', Add: '+', Profile: '◉', Settings: '⚙' };
const EMPTY_OVERVIEW = { entries: [], receipts: [], totalEntries: 0, totalReceipts: 0 };

function useLayoutProfile() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isWideTablet = width >= 900;
  const isShort = height < 650;
  const horizontalPadding = isWideTablet ? 36 : isTablet ? 28 : 14;
  return { width, height, isLandscape, isTablet, isWideTablet, isShort, horizontalPadding };
}

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.39a4.61 4.61 0 0 1-2 3.02v2.54h3.23c1.89-1.74 2.98-4.31 2.98-7.4Z" />
      <Path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.23-2.54c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.61A10 10 0 0 0 12 22Z" />
      <Path fill="#FBBC05" d="M6.4 13.86A6.01 6.01 0 0 1 6.09 12c0-.65.11-1.28.31-1.86V7.53H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.47l3.34-2.61Z" />
      <Path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.53l3.34 2.61c.79-2.37 3-4.13 5.6-4.13Z" />
    </Svg>
  );
}

function GitHubMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#FFFFFF" d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.2-3.11-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.16 1.19a10.9 10.9 0 0 1 5.75 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.08.75.81 1.2 1.84 1.2 3.11 0 4.46-2.71 5.45-5.29 5.74.42.36.79 1.07.79 2.16v3.02c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </Svg>
  );
}

function Brand({ small = false }) {
  return (
    <View style={styles.brand}>
      <Brandmark size={small ? 34 : 50} />
      <View style={styles.brandCopy}>
        <Text style={[styles.brandName, small && styles.brandSmall]}>BragStack</Text>
        {!small && <Text style={styles.brandTagline}>Proof of the impact you create.</Text>}
      </View>
    </View>
  );
}

function AuthScreen({ onSuccess }) {
  const layout = useLayoutProfile();
  const compact = layout.isShort || layout.width < 390;
  const split = layout.isWideTablet && layout.isLandscape;
  const contentWidth = Math.max(
    280,
    Math.min(layout.width - layout.horizontalPadding * 2, split ? 1120 : 560),
  );
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'register') {
        if (!name.trim() || !email.trim() || password.length < 8) {
          throw new Error('Enter your name, a valid email, and a password with at least 8 characters.');
        }
        const result = await register(name, email, password);
        setVerificationEmail(email.trim().toLowerCase());
        setMessage(
          result?.email_sent === false
            ? 'Account created. Verification email delivery needs another try.'
            : 'Account created. Check your email to verify it, then sign in.',
        );
        return;
      }
      if (mode === 'reset') {
        if (!email.trim()) throw new Error('Enter the email address on your BragStack account.');
        await requestPasswordReset(email);
        setMessage('If that email belongs to an account, a password reset link has been sent.');
        return;
      }
      if (!email.trim() || !password) throw new Error('Enter your email and password.');
      onSuccess(await login(email, password));
    } catch (authError) {
      setError(authError?.response ? getAuthErrorMessage(authError) : authError.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!verificationEmail || busy) return;
    setBusy(true);
    setError('');
    try {
      await resendVerification(verificationEmail);
      setMessage('A fresh verification email has been requested. Check your inbox.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const startOAuth = async (provider) => {
    if (Platform.OS !== 'web') return;
    await Linking.openURL(`${apiBaseURL}/auth/${provider}/login`);
  };

  const title = mode === 'register'
    ? 'Build proof that travels with your career.'
    : mode === 'reset'
      ? 'Get back into your proof.'
      : 'Your proof is ready when you are.';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.orbBlue} />
      <View pointerEvents="none" style={styles.orbPurple} />
      <ScrollView
        style={styles.loginScroll}
        contentContainerStyle={[styles.loginPage, compact && styles.loginPageCompact]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.loginShell, { width: contentWidth }, split && styles.loginShellSplit]}>
          <View style={[styles.brandHeader, compact && styles.brandHeaderCompact, split && styles.authAside]}>
            <Brand />
            <View style={styles.signalPill}>
              <Text style={styles.signalDot}>●</Text>
              <Text style={styles.signalText}>PRIVATE CAREER PROOF</Text>
            </View>
            {split ? (
              <View style={styles.authAsideCopy}>
                <Text style={styles.authAsideTitle}>Career proof that works wherever you work.</Text>
                <Text style={styles.muted}>Capture evidence on the device in your hand, then keep using the same BragStack account on the web.</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, styles.loginCard, compact && styles.loginCardCompact, split && styles.loginCardSplit]}>
            <Text style={styles.kicker}>{mode === 'register' ? 'CREATE ACCOUNT' : mode === 'reset' ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</Text>
            <Text style={[styles.loginTitle, compact && styles.loginTitleCompact]}>{title}</Text>
            <Text style={styles.muted}>
              {mode === 'register'
                ? 'Create one BragStack account for web and mobile. Your career evidence stays private by default.'
                : mode === 'reset'
                  ? 'We will send a secure reset link to your account email.'
                  : 'Open your private workspace and keep building evidence while the details are still fresh.'}
            </Text>

            {mode === 'register' ? (
              <>
                <Text style={styles.label}>NAME</Text>
                <TextInput value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your name" placeholderTextColor={colors.mutedStrong} style={styles.input} />
              </>
            ) : null}

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedStrong}
              style={styles.input}
            />

            {mode !== 'reset' ? (
              <>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType={mode === 'register' ? 'newPassword' : 'password'}
                  placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                  placeholderTextColor={colors.mutedStrong}
                  style={styles.input}
                  onSubmitEditing={submit}
                />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.success}>{message}</Text> : null}

            <Pressable onPress={submit} disabled={busy} style={[styles.button, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{mode === 'register' ? 'Create BragStack account' : mode === 'reset' ? 'Send reset link' : 'Sign in to BragStack'}</Text>}
            </Pressable>

            {verificationEmail ? (
              <Pressable onPress={resend} disabled={busy} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Resend verification email</Text>
              </Pressable>
            ) : null}

            {mode === 'login' ? (
              <Pressable onPress={() => changeMode('reset')} style={styles.linkButton}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            ) : null}

            {Platform.OS === 'web' && mode === 'login' ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.socialStack}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" onPress={() => startOAuth('google')} style={[styles.socialButton, styles.googleButton]}>
                    <GoogleMark />
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Continue with GitHub" onPress={() => startOAuth('github')} style={[styles.socialButton, styles.githubButton]}>
                    <GitHubMark />
                    <Text style={styles.githubText}>Continue with GitHub</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {mode === 'login' ? (
              <Pressable onPress={() => changeMode('register')} style={styles.authSwitch}>
                <Text style={styles.muted}>New to BragStack? <Text style={styles.linkText}>Create an account</Text></Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => changeMode('login')} style={styles.authSwitch}>
                <Text style={styles.muted}>Already have an account? <Text style={styles.linkText}>Sign in</Text></Text>
              </Pressable>
            )}

            <View style={styles.securityRow}>
              <Text style={styles.securityIcon}>⌁</Text>
              <Text style={styles.note}>Secure session storage • private by default</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Page({ kicker, title, children, refreshing = false, onRefresh, narrow = false }) {
  const layout = useLayoutProfile();
  const maxWidth = narrow ? 820 : layout.isWideTablet ? 1120 : layout.isTablet ? 900 : 760;
  const contentWidth = Math.max(280, Math.min(layout.width - layout.horizontalPadding * 2, maxWidth));
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.pageFrame,
          layout.isTablet && styles.pageFrameTablet,
          layout.isLandscape && layout.isShort && styles.pageFrameLandscapePhone,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      >
        <View style={[styles.pageShell, { width: contentWidth }]}>
          <View style={styles.page}>
            <Brand small />
            <Text style={styles.kicker}>{kicker}</Text>
            <Text style={[styles.title, layout.isTablet && styles.titleTablet, layout.isShort && styles.titleCompact]}>{title}</Text>
            {children}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ children }) {
  return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>;
}

function ProofCard({ title, body, status = 'Private proof', isPublic = false }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pill>{status}</Pill>
        <Text style={styles.private}>{isPublic ? '◉ Public' : '◌ Private'}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

function LoadingCard({ label = 'Loading your proof…' }) {
  return <View style={styles.loadingCard}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>;
}

function Home({ navigation, user, overview, loading, error, refreshing, onRefresh }) {
  const layout = useLayoutProfile();
  const wide = layout.isWideTablet;
  const verified = overview.receipts.filter((receipt) =>
    (receipt.confirmations || []).some((confirmation) => confirmation.status === 'confirmed'),
  ).length;
  const recent = overview.entries[0];

  return (
    <Page kicker="YOUR CAREER PROOF" title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}.`} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={[styles.homeGrid, wide && styles.homeGridWide]}>
        <View style={[styles.homePrimary, wide && styles.homePrimaryWide]}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>PROOF PULSE</Text>
            <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>Turn fresh wins into durable career proof.</Text>
            <Text style={styles.muted}>Capture the work, result, evidence, skills, and credit while the details are fresh.</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}><Text style={styles.metricNum}>{overview.totalEntries}</Text><Text style={styles.metricText}>Wins</Text></View>
              <View style={styles.metric}><Text style={styles.metricNum}>{overview.totalReceipts}</Text><Text style={styles.metricText}>Receipts</Text></View>
              <View style={styles.metric}><Text style={styles.metricNum}>{verified}</Text><Text style={styles.metricText}>Confirmed</Text></View>
            </View>
          </View>
        </View>

        <View style={[styles.homeSecondary, wide && styles.homeSecondaryWide]}>
          <Pressable style={styles.action} onPress={() => navigation.navigate('Add')}>
            <Text style={styles.plus}>+</Text>
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>Capture a win</Text>
              <Text style={styles.muted}>Save it privately to your real BragStack account.</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          {loading ? <LoadingCard /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && recent ? (
            <ProofCard title={recent.title} body={recent.impact || recent.action} status="Recent win" isPublic={recent.is_public} />
          ) : null}
          {!loading && !recent && !error ? (
            <View style={styles.emptyCard}><Text style={styles.cardTitle}>Your first win goes here.</Text><Text style={styles.muted}>Use Add to capture a real accomplishment. Nothing becomes public automatically.</Text></View>
          ) : null}
        </View>
      </View>
    </Page>
  );
}

function ProofGrid({ items, renderItem }) {
  const layout = useLayoutProfile();
  const twoColumns = layout.isWideTablet;
  return (
    <View style={[styles.proofGrid, twoColumns && styles.proofGridWide]}>
      {items.map((item) => (
        <View key={item.key} style={[styles.proofGridItem, twoColumns && styles.proofGridItemWide]}>
          {renderItem(item.value)}
        </View>
      ))}
    </View>
  );
}

function Proof({ overview, loading, error, refreshing, onRefresh }) {
  const receiptItems = overview.receipts.map((receipt) => ({ key: `receipt-${receipt.id}`, value: receipt }));
  const entryItems = overview.entries.map((entry) => ({ key: `entry-${entry.id}`, value: entry }));
  return (
    <Page kicker="PROOF LIBRARY" title="Your proof, synced." refreshing={refreshing} onRefresh={onRefresh}>
      {loading ? <LoadingCard label="Syncing accomplishments and Impact Receipts…" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && receiptItems.length > 0 ? <Text style={styles.sectionLabel}>IMPACT RECEIPTS</Text> : null}
      <ProofGrid
        items={receiptItems}
        renderItem={(receipt) => {
          const confirmed = (receipt.confirmations || []).some((confirmation) => confirmation.status === 'confirmed');
          const evidenceCount = (receipt.evidence || []).length;
          return (
            <ProofCard
              title={receipt.accomplishment}
              body={`${receipt.result}${evidenceCount ? ` • ${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'}` : ''}`}
              status={confirmed ? 'Confirmed receipt' : 'Impact Receipt'}
              isPublic={receipt.is_public}
            />
          );
        }}
      />

      {!loading && entryItems.length > 0 ? <Text style={styles.sectionLabel}>ACCOMPLISHMENTS</Text> : null}
      <ProofGrid
        items={entryItems}
        renderItem={(entry) => (
          <ProofCard title={entry.title} body={entry.impact || entry.action} status={entry.category || 'Accomplishment'} isPublic={entry.is_public} />
        )}
      />

      {!loading && !error && entryItems.length === 0 && receiptItems.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.cardTitle}>No proof yet.</Text><Text style={styles.muted}>Your mobile library is connected to production data. Add a win to start it.</Text></View>
      ) : null}
    </Page>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, autoCapitalize = 'sentences' }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedStrong}
        style={[styles.input, multiline && styles.textarea]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function Add({ navigation, onCreated }) {
  const [form, setForm] = useState({ title: '', situation: '', action: '', impact: '', category: '', tags: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const created = await createPrivateEntry(form);
      setForm({ title: '', situation: '', action: '', impact: '', category: '', tags: '' });
      setMessage('Saved privately to BragStack.');
      await onCreated(created);
      navigation.navigate('Proof');
    } catch (saveError) {
      setError(saveError?.response ? getProductErrorMessage(saveError, 'Could not save this accomplishment.') : saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page kicker="QUICK CAPTURE" title="Catch the win while it is fresh." narrow>
      <View style={styles.card}>
        <Text style={styles.muted}>This saves a real accomplishment to your BragStack account. The four proof fields are required so the app never invents missing career evidence.</Text>
        <Field label="SHORT TITLE" value={form.title} onChangeText={setField('title')} placeholder="Stabilized a failing deployment" />
        <Field label="CONTEXT" value={form.situation} onChangeText={setField('situation')} placeholder="What was happening before you stepped in?" multiline />
        <Field label="WHAT YOU DID" value={form.action} onChangeText={setField('action')} placeholder="Describe your contribution." multiline />
        <Field label="WHAT CHANGED" value={form.impact} onChangeText={setField('impact')} placeholder="Describe the result you can support." multiline />
        <Field label="CATEGORY" value={form.category} onChangeText={setField('category')} placeholder="General, Support, Platform, Leadership…" />
        <Field label="SKILLS (COMMA-SEPARATED)" value={form.tags} onChangeText={setField('tags')} placeholder="Docker, Kubernetes, Incident Response" autoCapitalize="words" />
        <View style={styles.securityRow}><Text style={styles.securityIcon}>⌁</Text><Text style={styles.note}>New mobile captures are private by default.</Text></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Pressable onPress={save} disabled={busy} style={[styles.button, busy && styles.disabled]}>
          {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Save private accomplishment</Text>}
        </Pressable>
      </View>
    </Page>
  );
}

function Profile({ user, onUserChange }) {
  const [form, setForm] = useState({ name: user?.name || '', headline: user?.headline || '', bio: user?.bio || '', location: user?.location || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({ name: user?.name || '', headline: user?.headline || '', bio: user?.bio || '', location: user?.location || '' });
  }, [user]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateProfile(user, form);
      onUserChange(updated);
      setMessage('Profile updated.');
    } catch (saveError) {
      setError(getProductErrorMessage(saveError, 'Could not update your profile.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page kicker="PROFESSIONAL STORY" title="Your story. Your control." narrow>
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Brandmark size={58} />
          <View style={styles.flexOne}>
            <Text style={styles.profileName}>{user?.name || 'BragStack Member'}</Text>
            <Text style={styles.muted}>{user?.public_slug ? `Public proof: usebragstack.com/brag/${user.public_slug}` : 'Public sharing stays under your control.'}</Text>
          </View>
        </View>
        <Field label="NAME" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Your name" autoCapitalize="words" />
        <Field label="HEADLINE" value={form.headline} onChangeText={(value) => setForm((current) => ({ ...current, headline: value }))} placeholder="Platform Support Engineer" />
        <Field label="LOCATION" value={form.location} onChangeText={(value) => setForm((current) => ({ ...current, location: value }))} placeholder="City, region" autoCapitalize="words" />
        <Field label="BIO" value={form.bio} onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))} placeholder="A short professional summary" multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Pressable onPress={save} disabled={busy || !form.name.trim()} style={[styles.button, (busy || !form.name.trim()) && styles.disabled]}>
          {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Save profile</Text>}
        </Pressable>
      </View>
    </Page>
  );
}

function Settings({ user, onSignOut }) {
  const layout = useLayoutProfile();
  const split = layout.isTablet;
  const open = (url) => Linking.openURL(url);
  return (
    <Page kicker="ACCOUNT" title="Built to keep your proof yours." narrow>
      <View style={[styles.settingsGrid, split && styles.settingsGridWide]}>
        <View style={[styles.settingsGridItem, split && styles.settingsGridItemWide]}>
          <View style={styles.card}><Text style={styles.cardTitle}>Signed in</Text><Text style={styles.muted}>{user?.email}</Text></View>
        </View>
        <View style={[styles.settingsGridItem, split && styles.settingsGridItemWide]}>
          <View style={styles.card}><Text style={styles.cardTitle}>Production API</Text><Text style={styles.muted}>{apiBaseURL}</Text></View>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & support</Text>
        <Pressable onPress={() => open('https://usebragstack.com/privacy')} style={styles.settingsLink}><Text style={styles.linkText}>Privacy policy</Text><Text style={styles.arrowSmall}>›</Text></Pressable>
        <Pressable onPress={() => open('https://usebragstack.com/terms')} style={styles.settingsLink}><Text style={styles.linkText}>Terms</Text><Text style={styles.arrowSmall}>›</Text></Pressable>
        <Pressable onPress={() => open('https://usebragstack.com/docs')} style={styles.settingsLink}><Text style={styles.linkText}>Help & documentation</Text><Text style={styles.arrowSmall}>›</Text></Pressable>
      </View>
      <Pressable style={styles.signout} onPress={onSignOut}><Text style={styles.signoutText}>Sign out</Text></Pressable>
    </Page>
  );
}

function Tabs({ user, onUserChange, onSignOut }) {
  const { width } = useWindowDimensions();
  const tabletNavigation = width >= 768;
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setOverview(await loadProofOverview());
    } catch (loadError) {
      setError(getProductErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void refresh(false); }, [refresh]);

  const shared = useMemo(
    () => ({ overview, loading, error, refreshing, onRefresh: () => refresh(true) }),
    [overview, loading, error, refreshing, refresh],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedStrong,
          tabBarHideOnKeyboard: true,
          tabBarPosition: tabletNavigation ? 'left' : 'bottom',
          tabBarVariant: tabletNavigation ? 'material' : 'uikit',
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: tabletNavigation ? styles.tabBarSide : styles.tabBarBottom,
          tabBarItemStyle: tabletNavigation ? styles.tabItemSide : styles.tabItemBottom,
          tabBarLabelStyle: tabletNavigation ? styles.tabLabelSide : styles.tabLabelBottom,
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>{icons[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Home">{(props) => <Home {...props} user={user} {...shared} />}</Tab.Screen>
        <Tab.Screen name="Proof">{(props) => <Proof {...props} {...shared} />}</Tab.Screen>
        <Tab.Screen name="Add">{(props) => <Add {...props} onCreated={() => refresh(true)} />}</Tab.Screen>
        <Tab.Screen name="Profile">{(props) => <Profile {...props} user={user} onUserChange={onUserChange} />}</Tab.Screen>
        <Tab.Screen name="Settings">{(props) => <Settings {...props} user={user} onSignOut={onSignOut} />}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const root = document.getElementById('root');
    const nodes = [document.documentElement, document.body, root].filter(Boolean);
    nodes.forEach((node) => {
      node.style.width = '100%';
      node.style.maxWidth = '100%';
      node.style.height = '100%';
      node.style.minWidth = '0';
      node.style.minHeight = '0';
      node.style.margin = '0';
      node.style.padding = '0';
    });
    if (root) {
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.overflow = 'hidden';
    }
    document.body.style.overflow = 'hidden';
    return undefined;
  }, []);

  useEffect(() => {
    let live = true;
    restoreSession()
      .then((restored) => { if (live) setUser(restored); })
      .catch(() => {})
      .finally(() => { if (live) setBooting(false); });
    return () => { live = false; };
  }, []);

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  const content = booting
    ? <SafeAreaView style={styles.boot}><Brandmark size={72} /><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Opening your BragStack…</Text></SafeAreaView>
    : user
      ? <Tabs user={user} onUserChange={setUser} onSignOut={signOut} />
      : <AuthScreen onSuccess={setUser} />;

  return <SafeAreaProvider style={styles.appRoot}>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', backgroundColor: colors.background },
  safe: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', backgroundColor: colors.background },
  boot: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 20 },
  flexOne: { flex: 1, minWidth: 0 },

  loginScroll: { flex: 1, minWidth: 0, width: '100%' },
  loginPage: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 34, width: '100%', minWidth: 0 },
  loginPageCompact: { justifyContent: 'flex-start', paddingVertical: 14 },
  loginShell: { alignSelf: 'center', gap: 20, minWidth: 0, maxWidth: '100%' },
  loginShellSplit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 48 },
  brandHeader: { gap: 12, minWidth: 0 },
  brandHeaderCompact: { gap: 9 },
  authAside: { flex: 1, maxWidth: 440, justifyContent: 'center' },
  authAsideCopy: { gap: 10, marginTop: 30 },
  authAsideTitle: { color: colors.text, fontSize: 36, lineHeight: 41, fontWeight: '900', letterSpacing: -0.7 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  brandCopy: { flexShrink: 1, minWidth: 0 },
  brandName: { color: colors.text, fontSize: 26, fontWeight: '900', flexShrink: 1 },
  brandSmall: { fontSize: 20 },
  brandTagline: { color: colors.muted, fontSize: 12, marginTop: 2 },
  signalPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(105,228,246,0.08)', borderWidth: 1, borderColor: 'rgba(105,228,246,0.20)' },
  signalDot: { color: colors.cyan, fontSize: 9 },
  signalText: { color: colors.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  orbBlue: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(166,220,255,0.08)', top: -90, right: -100 },
  orbPurple: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(173,145,255,0.08)', bottom: -90, left: -100 },

  pageFrame: { flexGrow: 1, alignItems: 'center', paddingBottom: 110, paddingTop: 10, width: '100%', minWidth: 0 },
  pageFrameTablet: { paddingBottom: 42, paddingTop: 18 },
  pageFrameLandscapePhone: { paddingBottom: 88, paddingTop: 4 },
  pageShell: { alignSelf: 'center', maxWidth: '100%', minWidth: 0 },
  page: { paddingTop: 8, gap: 14, minWidth: 0 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.5, flexShrink: 1 },
  titleTablet: { fontSize: 40, lineHeight: 45 },
  titleCompact: { fontSize: 29, lineHeight: 34 },
  loginTitle: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.6, flexShrink: 1 },
  loginTitleCompact: { fontSize: 26, lineHeight: 31 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  note: { color: colors.mutedStrong, fontSize: 11, textAlign: 'center', flexShrink: 1 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 12, minWidth: 0, width: '100%' },
  loginCard: { backgroundColor: 'rgba(13,21,38,0.96)', borderColor: 'rgba(173,145,255,0.26)', padding: 20, gap: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.28, shadowRadius: 30, elevation: 12 },
  loginCardCompact: { padding: 16, gap: 10, borderRadius: 22 },
  loginCardSplit: { flex: 1, maxWidth: 540 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 2 },
  fieldGroup: { gap: 7, width: '100%' },
  input: { minHeight: 50, width: '100%', backgroundColor: 'rgba(19,30,51,0.92)', borderWidth: 1, borderColor: 'rgba(166,220,255,0.16)', borderRadius: 14, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minWidth: 0 },
  textarea: { minHeight: 88 },
  button: { minHeight: 52, width: '100%', borderRadius: radius.pill, backgroundColor: colors.primary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: colors.background, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 46, width: '100%', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  linkButton: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  linkText: { color: colors.primary, fontWeight: '850' },
  authSwitch: { alignSelf: 'center', paddingVertical: 2 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  success: { color: colors.cyan, fontSize: 13, lineHeight: 19 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2, minWidth: 0 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.mutedStrong, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, flexShrink: 1 },
  socialStack: { gap: 9 },
  socialButton: { minHeight: 50, width: '100%', borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0' },
  googleText: { color: '#202124', fontWeight: '800', flexShrink: 1 },
  githubButton: { backgroundColor: '#24292F', borderWidth: 1, borderColor: '#57606A' },
  githubText: { color: '#FFFFFF', fontWeight: '800', flexShrink: 1 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  securityIcon: { color: colors.cyan, fontSize: 15 },

  homeGrid: { gap: 14, width: '100%' },
  homeGridWide: { flexDirection: 'row', alignItems: 'stretch', gap: 18 },
  homePrimary: { width: '100%' },
  homePrimaryWide: { flex: 1.18, minWidth: 0 },
  homeSecondary: { width: '100%', gap: 14 },
  homeSecondaryWide: { flex: 0.82, minWidth: 0 },
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(166,220,255,0.28)', borderRadius: radius.lg, padding: 18, gap: 10, width: '100%' },
  heroLabel: { color: colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.8 },
  heroTitle: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '900' },
  heroTitleWide: { fontSize: 31, lineHeight: 36 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  metric: { flexGrow: 1, flexBasis: 88, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: 10 },
  metricNum: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  metricText: { color: colors.muted, fontSize: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 15, minWidth: 0, width: '100%' },
  plus: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, color: colors.background, textAlign: 'center', textAlignVertical: 'center', fontSize: 27 },
  arrow: { color: colors.primary, fontSize: 28 },
  arrowSmall: { color: colors.primary, fontSize: 22 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900', flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(166,220,255,0.28)', backgroundColor: 'rgba(166,220,255,0.10)', paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  private: { color: colors.mutedStrong, fontSize: 11 },
  loadingCard: { minHeight: 90, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, width: '100%' },
  emptyCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, gap: 8, width: '100%' },
  sectionLabel: { color: colors.mutedStrong, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 6 },

  proofGrid: { width: '100%', gap: 12 },
  proofGridWide: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 14 },
  proofGridItem: { width: '100%' },
  proofGridItemWide: { width: '48.9%' },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0, marginBottom: 2 },
  profileName: { color: colors.text, fontSize: 20, fontWeight: '900', flexShrink: 1 },
  settingsGrid: { gap: 12, width: '100%' },
  settingsGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  settingsGridItem: { width: '100%' },
  settingsGridItemWide: { flex: 1, minWidth: 0 },
  settingsLink: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  signout: { minHeight: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,176,176,0.3)', alignItems: 'center', justifyContent: 'center', width: '100%' },
  signoutText: { color: colors.danger, fontWeight: '900' },

  tabBarBottom: { backgroundColor: colors.sidebar, borderTopColor: colors.border, height: 76, paddingTop: 7, paddingBottom: 9 },
  tabBarSide: { backgroundColor: colors.sidebar, borderTopWidth: 0, borderRightWidth: 1, borderRightColor: colors.border, width: 96, paddingVertical: 16 },
  tabItemBottom: { minHeight: 54 },
  tabItemSide: { minHeight: 70, marginVertical: 2, borderRadius: 18 },
  tabLabelBottom: { fontSize: 10, fontWeight: '800' },
  tabLabelSide: { fontSize: 10, fontWeight: '850', marginTop: 3 },
  tabIcon: { fontSize: 18, fontWeight: '800' },
});
