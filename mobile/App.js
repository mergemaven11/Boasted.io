import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Brandmark from './src/Brandmark';
import { getAuthErrorMessage, login, logout, restoreSession } from './src/authApi';
import { colors, navigationTheme, radius, spacing } from './src/theme';

const Tab = createBottomTabNavigator();
const icons = { Home: '⌂', Proof: '✓', Add: '+', Profile: '◉', Settings: '⚙' };

function Brand({ small = false }) {
  return <View style={styles.brand}><Brandmark size={small ? 34 : 58} /><View><Text style={[styles.brandName, small && styles.brandSmall]}>BragStack</Text>{!small && <Text style={styles.muted}>Proof of the impact you create.</Text>}</View></View>;
}

function Login({ onSuccess }) {
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
  return <SafeAreaView style={styles.safe}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled"><Brand /><View style={styles.card}><Text style={styles.kicker}>WELCOME BACK</Text><Text style={styles.loginTitle}>Your proof is waiting.</Text><Text style={styles.muted}>Sign in with your existing BragStack account.</Text><Text style={styles.label}>EMAIL</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedStrong} style={styles.input} /><Text style={styles.label}>PASSWORD</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.mutedStrong} style={styles.input} onSubmitEditing={submit} />{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy || !email.trim() || !password} style={[styles.button, (busy || !email.trim() || !password) && styles.disabled]}>{busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Sign in</Text>}</Pressable><Text style={styles.note}>🔒 Session tokens are kept in encrypted device storage.</Text></View></ScrollView></SafeAreaView>;
}

function Page({ kicker, title, children }) {
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}><Brand small /><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text>{children}</ScrollView></SafeAreaView>;
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

function Profile({ user }) { return <Page kicker="PROFESSIONAL STORY" title="Your story. Your control."><View style={styles.card}><View style={styles.brand}><Brandmark size={62} /><View style={{ flex: 1 }}><Text style={styles.profileName}>{user?.name || 'BragStack Member'}</Text><Text style={styles.muted}>{user?.headline || 'Your evidence-backed professional story'}</Text></View></View><Text style={styles.muted}>{user?.public_slug ? `Public profile: /${user.public_slug}` : 'Public profile ready when you choose to share.'}</Text></View></Page>; }
function Settings({ user, onSignOut }) { return <Page kicker="ACCOUNT" title="Built to keep your proof yours."><View style={styles.card}><Text style={styles.cardTitle}>Signed in</Text><Text style={styles.muted}>{user?.email}</Text></View><View style={styles.card}><Text style={styles.cardTitle}>Official app theme</Text><Text style={styles.muted}>Near-black • warm ivory • BragStack peach</Text></View><Pressable style={styles.signout} onPress={onSignOut}><Text style={styles.signoutText}>Sign out</Text></Pressable></Page>; }

function Tabs({ user, onSignOut }) {
  return <NavigationContainer theme={navigationTheme}><StatusBar style="light" /><Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedStrong, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel, tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>{icons[route.name]}</Text> })}><Tab.Screen name="Home">{p => <Home {...p} user={user} />}</Tab.Screen><Tab.Screen name="Proof" component={Proof} /><Tab.Screen name="Add" component={Add} /><Tab.Screen name="Profile">{p => <Profile {...p} user={user} />}</Tab.Screen><Tab.Screen name="Settings">{p => <Settings {...p} user={user} onSignOut={onSignOut} />}</Tab.Screen></Tab.Navigator></NavigationContainer>;
}

export default function App() {
  const [user, setUser] = useState(null); const [booting, setBooting] = useState(true);
  useEffect(() => { let live = true; restoreSession().then(u => live && setUser(u)).catch(() => {}).finally(() => live && setBooting(false)); return () => { live = false; }; }, []);
  const signOut = async () => { await logout(); setUser(null); };
  const content = booting
    ? <SafeAreaView style={styles.boot}><Brandmark size={76} /><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Opening your BragStack…</Text></SafeAreaView>
    : user
      ? <Tabs user={user} onSignOut={signOut} />
      : <Login onSuccess={setUser} />;
  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, boot: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 20 }, loginPage: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 30 }, page: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 110, gap: 16 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 14 }, brandName: { color: colors.text, fontSize: 28, fontWeight: '900' }, brandSmall: { fontSize: 20 }, kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2 }, title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900' }, loginTitle: { color: colors.text, fontSize: 31, fontWeight: '900' }, muted: { color: colors.muted, fontSize: 14, lineHeight: 21 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, gap: 12 }, label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 5 }, input: { minHeight: 52, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, padding: 14, fontSize: 15 }, tall: { minHeight: 85, textAlignVertical: 'top' }, button: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.4 }, buttonText: { color: colors.background, fontWeight: '900' }, note: { color: colors.mutedStrong, fontSize: 11, textAlign: 'center' }, error: { color: colors.danger, fontSize: 13 }, hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,177,132,0.28)', borderRadius: radius.lg, padding: 20, gap: 10 }, heroLabel: { color: colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.8 }, heroTitle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '900' }, metrics: { flexDirection: 'row', gap: 8, marginTop: 8 }, metric: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: 10 }, metricNum: { color: colors.primary, fontSize: 22, fontWeight: '900' }, metricText: { color: colors.muted, fontSize: 10 }, action: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }, plus: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, color: colors.background, textAlign: 'center', textAlignVertical: 'center', fontSize: 28 }, arrow: { color: colors.primary, fontSize: 30 }, cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,177,132,0.28)', backgroundColor: 'rgba(255,177,132,0.10)', paddingHorizontal: 10, paddingVertical: 6 }, pillText: { color: colors.text, fontSize: 10, fontWeight: '900' }, private: { color: colors.mutedStrong, fontSize: 11 }, profileName: { color: colors.text, fontSize: 20, fontWeight: '900' }, signout: { minHeight: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,176,176,0.3)', alignItems: 'center', justifyContent: 'center' }, signoutText: { color: colors.danger, fontWeight: '900' }, tabBar: { backgroundColor: colors.sidebar, borderTopColor: colors.border, height: 78, paddingTop: 8, paddingBottom: 10 }, tabLabel: { fontSize: 10, fontWeight: '800' }, tabIcon: { fontSize: 18, fontWeight: '800' }
});
