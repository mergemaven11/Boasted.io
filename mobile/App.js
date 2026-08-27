import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Brandmark from './src/Brandmark';
import { apiBaseURL } from './src/api';
import { getAuthErrorMessage, login, logout, restoreSession } from './src/authApi';
import { colors, navigationTheme, radius } from './src/theme';

const Tab = createBottomTabNavigator();
const icons = { Home: '⌂', Proof: '✓', Add: '+', Profile: '◉', Settings: '⚙' };

function GoogleMark() {
  return <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true"><Path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.39a4.61 4.61 0 0 1-2 3.02v2.54h3.23c1.89-1.74 2.98-4.31 2.98-7.4Z"/><Path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.23-2.54c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.61A10 10 0 0 0 12 22Z"/><Path fill="#FBBC05" d="M6.4 13.86A6.01 6.01 0 0 1 6.09 12c0-.65.11-1.28.31-1.86V7.53H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.47l3.34-2.61Z"/><Path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.53l3.34 2.61c.79-2.37 3-4.13 5.6-4.13Z"/></Svg>;
}

function GitHubMark() {
  return <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true"><Path fill="#FFFFFF" d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.2-3.11-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.16 1.19a10.9 10.9 0 0 1 5.75 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.08.75.81 1.2 1.84 1.2 3.11 0 4.46-2.71 5.45-5.29 5.74.42.36.79 1.07.79 2.16v3.02c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"/></Svg>;
}

function Brand({ small = false }) {
  return <View style={styles.brand}><Brandmark size={small ? 34 : 58} /><View style={styles.brandCopy}><Text style={[styles.brandName, small && styles.brandSmall]}>BragStack</Text>{!small && <Text style={styles.muted}>Proof of the impact you create.</Text>}</View></View>;
}

function Login({ onSuccess }) {
  const { width, height } = useWindowDimensions();
  const compact = height < 760 || width < 390;
  const tablet = width >= 768;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password || busy) return;
    setBusy(true); setError('');
    try { onSuccess(await login(email, password)); }
    catch (e) { setError(getAuthErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const startOAuth = async (provider) => {
    const returnTo = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'bragstack://oauth';
    const url = `${apiBaseURL}/auth/${provider}/login?return_to=${encodeURIComponent(returnTo)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(url);
    else await Linking.openURL(url);
  };

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <View pointerEvents="none" style={styles.orbBlue}/><View pointerEvents="none" style={styles.orbPurple}/>
    <ScrollView style={styles.loginScroll} contentContainerStyle={[styles.loginPage, compact && styles.loginPageCompact, tablet && styles.loginPageTablet]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.loginFrame, tablet ? styles.loginFrameTablet : styles.loginFramePhone]}>
        <View style={[styles.loginShell, compact && styles.loginShellCompact]}>
          <View style={styles.brandHeader}><Brand /><View style={styles.signalPill}><Text style={styles.signalDot}>●</Text><Text style={styles.signalText}>PRIVATE CAREER PROOF</Text></View></View>
          <View style={[styles.card, styles.loginCard, compact && styles.loginCardCompact, tablet && styles.loginCardTablet]}>
            <Text style={styles.kicker}>WELCOME BACK</Text>
            <Text style={[styles.loginTitle, compact && styles.loginTitleCompact]}>Your proof is ready when you are.</Text>
            <Text style={styles.muted}>Open your private workspace and keep building evidence that travels with your career.</Text>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedStrong} style={[styles.input, compact && styles.inputCompact]} />
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.mutedStrong} style={[styles.input, compact && styles.inputCompact]} onSubmitEditing={submit} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable onPress={submit} disabled={busy || !email.trim() || !password} style={[styles.button, compact && styles.controlCompact, (busy || !email.trim() || !password) && styles.disabled]}>{busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Sign in to BragStack</Text>}</Pressable>
            <View style={styles.divider}><View style={styles.dividerLine}/><Text style={styles.dividerText}>OR CONTINUE WITH</Text><View style={styles.dividerLine}/></View>
            <View style={styles.socialStack}>
              <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" onPress={() => startOAuth('google')} style={[styles.socialButton, styles.googleButton, compact && styles.controlCompact]}><GoogleMark/><Text style={styles.googleText}>Continue with Google</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Continue with GitHub" onPress={() => startOAuth('github')} style={[styles.socialButton, styles.githubButton, compact && styles.controlCompact]}><GitHubMark/><Text style={styles.githubText}>Continue with GitHub</Text></Pressable>
            </View>
            <View style={styles.securityRow}><Text style={styles.securityIcon}>⌁</Text><Text style={styles.note}>Your session stays on this device.</Text></View>
          </View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function Page({ kicker, title, children }) {
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.pageFrame} showsVerticalScrollIndicator={false}><View style={styles.pageShell}><View style={styles.page}><Brand small /><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text>{children}</View></View></ScrollView></SafeAreaView>;
}

function Pill({ children }) { return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>; }
function ProofCard({ title, body, verified }) { return <View style={styles.card}><View style={styles.row}><Pill>{verified ? 'Verified' : 'Private draft'}</Pill><Text style={styles.private}>◌ Private</Text></View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.muted}>{body}</Text></View>; }

function Home({ navigation, user }) {
  return <Page kicker="YOUR CAREER PROOF" title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}.`}><View style={styles.hero}><Text style={styles.heroLabel}>PROOF PULSE</Text><Text style={styles.heroTitle}>Turn fresh wins into durable career proof.</Text><Text style={styles.muted}>Capture the work, result, evidence, skills, and credit while the details are fresh.</Text><View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricNum}>12</Text><Text style={styles.metricText}>Receipts</Text></View><View style={styles.metric}><Text style={styles.metricNum}>4</Text><Text style={styles.metricText}>Verified</Text></View><View style={styles.metric}><Text style={styles.metricNum}>3</Text><Text style={styles.metricText}>With proof</Text></View></View></View><Pressable style={styles.action} onPress={() => navigation.navigate('Add')}><Text style={styles.plus}>+</Text><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Capture a win</Text><Text style={styles.muted}>Start private. Add evidence when you have it.</Text></View><Text style={styles.arrow}>›</Text></Pressable><ProofCard title="Reduced incident recovery time" body="32% faster recovery after standardizing the response workflow." verified /></Page>;
}

function Proof() { return <Page kicker="PROOF LIBRARY" title="Impact Receipts"><ProofCard title="Reduced incident recovery time" body="32% faster recovery • Runbook and incident timeline attached" verified /><ProofCard title="Automated release checks" body="Platform tooling • Shared credit with the release engineering team" /></Page>; }

function Add() {
  const [win, setWin] = useState(''); const [result, setResult] = useState(''); const [draft, setDraft] = useState(null);
  return <Page kicker="QUICK CAPTURE" title="Catch the win before it disappears."><View style={styles.card}><Text style={styles.label}>WHAT HAPPENED?</Text><TextInput value={win} onChangeText={setWin} placeholder="Shipped a safer deployment workflow" placeholderTextColor={colors.mutedStrong} style={styles.input} multiline /><Text style={styles.label}>WHAT CHANGED?</Text><TextInput value={result} onChangeText={setResult} placeholder="Metric or outcome — optional" placeholderTextColor={colors.mutedStrong} style={[styles.input, styles.tall]} multiline /><Text style={styles.note}>🔒 Drafts stay private by default.</Text><Pressable disabled={!win.trim()} onPress={() => setDraft({ win: win.trim(), result: result.trim() })} style={[styles.button, !win.trim() && styles.disabled]}><Text style={styles.buttonText}>Preview Impact Receipt</Text></Pressable></View>{draft && <ProofCard title={draft.win} body={draft.result || 'Result not added yet — BragStack will not invent one.'} />}</Page>;
}

function Profile({ user }) { return <Page kicker="PROFESSIONAL STORY" title="Your story. Your control."><View style={styles.card}><View style={styles.brand}><Brandmark size={62} /><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.profileName}>{user?.name || 'BragStack Member'}</Text><Text style={styles.muted}>{user?.headline || 'Your evidence-backed professional story'}</Text></View></View><Text style={styles.muted}>{user?.public_slug ? `Public profile: /${user.public_slug}` : 'Public profile ready when you choose to share.'}</Text></View></Page>; }
function Settings({ user, onSignOut }) { return <Page kicker="ACCOUNT" title="Built to keep your proof yours."><View style={styles.card}><Text style={styles.cardTitle}>Signed in</Text><Text style={styles.muted}>{user?.email}</Text></View><View style={styles.card}><Text style={styles.cardTitle}>Official app theme</Text><Text style={styles.muted}>Deep navy • crisp white • BragStack blue + purple</Text></View><Pressable style={styles.signout} onPress={onSignOut}><Text style={styles.signoutText}>Sign out</Text></Pressable></Page>; }

function Tabs({ user, onSignOut }) {
  return <NavigationContainer theme={navigationTheme}><StatusBar style="light" /><Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedStrong, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel, tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>{icons[route.name]}</Text> })}><Tab.Screen name="Home">{p => <Home {...p} user={user} />}</Tab.Screen><Tab.Screen name="Proof" component={Proof} /><Tab.Screen name="Add" component={Add} /><Tab.Screen name="Profile">{p => <Profile {...p} user={user} />}</Tab.Screen><Tab.Screen name="Settings">{p => <Settings {...p} user={user} onSignOut={onSignOut} />}</Tab.Screen></Tab.Navigator></NavigationContainer>;
}

export default function App() {
  const [user, setUser] = useState(null); const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const nodes = [html, body, root].filter(Boolean);
    nodes.forEach((node) => {
      node.style.width = '100%';
      node.style.height = '100%';
      node.style.minWidth = '0';
      node.style.minHeight = '0';
      node.style.margin = '0';
      node.style.padding = '0';
    });
    if (root) { root.style.display = 'flex'; root.style.flexDirection = 'column'; }
    body.style.overflow = 'hidden';
    return undefined;
  }, []);

  useEffect(() => { let live = true; restoreSession().then(u => live && setUser(u)).catch(() => {}).finally(() => live && setBooting(false)); return () => { live = false; }; }, []);
  const signOut = async () => { await logout(); setUser(null); };
  const content = booting ? <SafeAreaView style={styles.boot}><Brandmark size={76} /><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Opening your BragStack…</Text></SafeAreaView> : user ? <Tabs user={user} onSignOut={signOut} /> : <Login onSuccess={setUser} />;
  return <SafeAreaProvider style={styles.appRoot}>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', backgroundColor: colors.background },
  safe: { flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', backgroundColor: colors.background },
  boot: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 20 },
  loginScroll: { flex: 1, minWidth: 0 },
  loginPage: { flexGrow: 1, alignItems: 'stretch', paddingTop: 44, paddingBottom: 48 },
  loginPageCompact: { paddingTop: 18, paddingBottom: 32 },
  loginPageTablet: { justifyContent: 'center', paddingTop: 56, paddingBottom: 56 },
  loginFrame: { alignSelf: 'stretch', alignItems: 'center' },
  loginFramePhone: { paddingHorizontal: 18 },
  loginFrameTablet: { paddingHorizontal: 32 },
  loginShell: { alignSelf: 'stretch', width: '100%', maxWidth: 560, gap: 24 },
  loginShellCompact: { gap: 16 },
  brandHeader: { gap: 14, zIndex: 2, minWidth: 0 },
  signalPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(105,228,246,0.08)', borderWidth: 1, borderColor: 'rgba(105,228,246,0.20)' },
  signalDot: { color: colors.cyan, fontSize: 9 },
  signalText: { color: colors.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  orbBlue: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(166,220,255,0.08)', top: -90, right: -100 },
  orbPurple: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(173,145,255,0.08)', bottom: -90, left: -100 },
  pageFrame: { flexGrow: 1, alignItems: 'stretch', paddingBottom: 110, paddingHorizontal: 18 },
  pageShell: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  page: { paddingTop: 16, gap: 16, minWidth: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, minWidth: 0 },
  brandCopy: { flexShrink: 1, minWidth: 0 },
  brandName: { color: colors.text, fontSize: 28, fontWeight: '900', flexShrink: 1 },
  brandSmall: { fontSize: 20 },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', flexShrink: 1 },
  loginTitle: { color: colors.text, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -0.8, flexShrink: 1 },
  loginTitleCompact: { fontSize: 28, lineHeight: 32 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, gap: 12, minWidth: 0 },
  loginCard: { backgroundColor: 'rgba(13,21,38,0.94)', borderColor: 'rgba(173,145,255,0.26)', padding: 22, gap: 13, shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.28, shadowRadius: 30, elevation: 12 },
  loginCardCompact: { padding: 17, gap: 10, borderRadius: 22 },
  loginCardTablet: { padding: 28, gap: 15 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 5 },
  input: { minHeight: 54, width: '100%', backgroundColor: 'rgba(19,30,51,0.92)', borderWidth: 1, borderColor: 'rgba(166,220,255,0.14)', borderRadius: 16, color: colors.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  inputCompact: { minHeight: 48, paddingVertical: 11 },
  tall: { minHeight: 85, textAlignVertical: 'top' },
  button: { minHeight: 54, width: '100%', borderRadius: radius.pill, backgroundColor: colors.primary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 5 },
  controlCompact: { minHeight: 48 },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontWeight: '900', letterSpacing: 0.1 },
  note: { color: colors.mutedStrong, fontSize: 11, textAlign: 'center', flexShrink: 1 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  securityIcon: { color: colors.cyan, fontSize: 15 },
  error: { color: colors.danger, fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 3, minWidth: 0 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.mutedStrong, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, flexShrink: 1 },
  socialStack: { gap: 10 },
  socialButton: { minHeight: 52, width: '100%', borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0' },
  googleText: { color: '#202124', fontWeight: '800', flexShrink: 1 },
  githubButton: { backgroundColor: '#24292F', borderWidth: 1, borderColor: '#57606A' },
  githubText: { color: '#FFFFFF', fontWeight: '800', flexShrink: 1 },
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(166,220,255,0.28)', borderRadius: radius.lg, padding: 20, gap: 10 },
  heroLabel: { color: colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.8 },
  heroTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metric: { flexGrow: 1, flexBasis: 90, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: 10 },
  metricNum: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  metricText: { color: colors.muted, fontSize: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, minWidth: 0 },
  plus: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, color: colors.background, textAlign: 'center', textAlignVertical: 'center', fontSize: 28 },
  arrow: { color: colors.primary, fontSize: 30 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900', flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(166,220,255,0.28)', backgroundColor: 'rgba(166,220,255,0.10)', paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  private: { color: colors.mutedStrong, fontSize: 11 },
  profileName: { color: colors.text, fontSize: 20, fontWeight: '900', flexShrink: 1 },
  signout: { minHeight: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,176,176,0.3)', alignItems: 'center', justifyContent: 'center' },
  signoutText: { color: colors.danger, fontWeight: '900' },
  tabBar: { backgroundColor: colors.sidebar, borderTopColor: colors.border, height: 78, paddingTop: 8, paddingBottom: 10 },
  tabLabel: { fontSize: 10, fontWeight: '800' },
  tabIcon: { fontSize: 18, fontWeight: '800' }
});