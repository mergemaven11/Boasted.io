import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, navigationTheme, radius, spacing } from './src/theme';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: '⌂',
  Proof: '✓',
  Add: '+',
  Profile: '◉',
  Settings: '⚙',
};

function Screen({ eyebrow, title, children, demo = false }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {demo ? <Pill label="Preview" tone="violet" /> : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ label, tone = 'primary' }) {
  const violet = tone === 'violet';
  const success = tone === 'success';
  return (
    <View
      style={[
        styles.pill,
        violet && styles.pillViolet,
        success && styles.pillSuccess,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          violet && styles.pillTextViolet,
          success && styles.pillTextSuccess,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Stat({ value, label, accent = false }) {
  return (
    <View style={[styles.stat, accent && styles.statAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProofCard({ title, result, status, privacy = 'Private' }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Pill label={status} tone={status === 'Verified' ? 'success' : 'primary'} />
        <Text style={styles.privacyLabel}>◌ {privacy}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{result}</Text>
    </View>
  );
}

function HomeScreen({ navigation }) {
  return (
    <Screen eyebrow="Your career proof" title="Proof that moves with you." demo>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroLabel}>PROOF PULSE</Text>
        <Text style={styles.heroTitle}>Your wins are getting stronger.</Text>
        <Text style={styles.body}>
          Capture outcomes while they are fresh, then turn them into evidence-backed career stories.
        </Text>
        <View style={styles.statRow}>
          <Stat value="12" label="Receipts" accent />
          <Stat value="4" label="Verified" />
          <Stat value="3" label="With proof" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Keep the streak alive</Text>
        <Text style={styles.sectionHint}>This week</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        onPress={() => navigation.navigate('Add')}
        accessibilityRole="button"
        accessibilityLabel="Capture a new accomplishment"
      >
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>+</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.actionTitle}>Capture a win in 30 seconds</Text>
          <Text style={styles.body}>Start with what happened. Add proof when you have it.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent proof</Text>
        <Text style={styles.sectionHint}>Preview data</Text>
      </View>
      <ProofCard
        title="Reduced incident recovery time"
        result="Result: 32% faster recovery after standardizing the response workflow."
        status="Verified"
      />
    </Screen>
  );
}

function ProofScreen() {
  return (
    <Screen eyebrow="Proof library" title="Your Impact Receipts" demo>
      <View style={styles.filterRow}>
        <Pill label="All 12" />
        <Pill label="Verified 4" tone="success" />
        <Pill label="Needs proof 2" tone="violet" />
      </View>
      <ProofCard
        title="Reduced incident recovery time"
        result="32% faster recovery • Runbook and incident timeline attached"
        status="Verified"
      />
      <ProofCard
        title="Automated release checks"
        result="Platform tooling • Shared credit with the release engineering team"
        status="Evidence added"
      />
      <ProofCard
        title="Improved support handoff quality"
        result="Captured the process change and outcome; add evidence when available."
        status="Needs proof"
      />
    </Screen>
  );
}

function AddScreen() {
  const [win, setWin] = useState('');
  const [result, setResult] = useState('');
  const [draft, setDraft] = useState(null);
  const canSave = Boolean(win.trim());

  function previewDraft() {
    if (!canSave) return;
    setDraft({ win: win.trim(), result: result.trim() });
  }

  return (
    <Screen eyebrow="Quick capture" title="Catch the win before it disappears.">
      <View style={styles.captureCard}>
        <Text style={styles.fieldLabel}>WHAT HAPPENED?</Text>
        <TextInput
          value={win}
          onChangeText={setWin}
          placeholder="e.g. Shipped a safer deployment workflow"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          accessibilityLabel="Accomplishment"
        />

        <Text style={styles.fieldLabel}>WHAT CHANGED?</Text>
        <TextInput
          value={result}
          onChangeText={setResult}
          placeholder="Add a result, metric, or outcome — optional for now"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputTall]}
          multiline
          accessibilityLabel="Result"
        />

        <Text style={styles.helperText}>
          🔒 Drafts are private by default. Evidence and credit can be added in the full flow.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.pressed,
          ]}
          onPress={previewDraft}
          disabled={!canSave}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Preview Impact Receipt</Text>
        </Pressable>
      </View>

      {draft ? (
        <View style={styles.previewCard}>
          <View style={styles.cardTopRow}>
            <Pill label="Draft" tone="violet" />
            <Text style={styles.privacyLabel}>◌ Private</Text>
          </View>
          <Text style={styles.previewLabel}>IMPACT RECEIPT PREVIEW</Text>
          <Text style={styles.cardTitle}>{draft.win}</Text>
          <Text style={styles.body}>
            {draft.result || 'Result not added yet — BragStack will keep the draft without inventing one.'}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function ProfileScreen() {
  const [publicPreview, setPublicPreview] = useState(false);

  return (
    <Screen eyebrow="Professional story" title="Your story. Your control." demo>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>BS</Text>
        </View>
        <Text style={styles.profileName}>BragStack Member</Text>
        <Text style={styles.body}>Platform • Reliability • Automation</Text>
        <View style={styles.profileMeta}>
          <Pill label="12 receipts" />
          <Pill label="4 verified" tone="success" />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Public profile preview</Text>
            <Text style={styles.body}>See the shareable version without exposing private workplace evidence.</Text>
          </View>
          <Pressable
            onPress={() => setPublicPreview((value) => !value)}
            style={[styles.toggle, publicPreview && styles.toggleActive]}
            accessibilityRole="switch"
            accessibilityState={{ checked: publicPreview }}
          >
            <View style={[styles.toggleKnob, publicPreview && styles.toggleKnobActive]} />
          </Pressable>
        </View>
        {publicPreview ? (
          <View style={styles.publicPreview}>
            <Text style={styles.previewLabel}>VISIBLE IN PREVIEW</Text>
            <Text style={styles.publicPreviewText}>3 selected accomplishments • 5 skills • no private evidence</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function SettingsScreen() {
  return (
    <Screen eyebrow="Account" title="Built to keep your proof yours.">
      <View style={styles.securityCard}>
        <Text style={styles.securityIcon}>✓</Text>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Privacy defaults are on</Text>
          <Text style={styles.body}>Secure session storage • Private evidence • Explicit sharing</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <Text style={styles.body}>BragStack dark • Sky-blue + violet accents</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mobile foundation</Text>
        <Text style={styles.body}>No unnecessary device permissions requested. Store disclosures and account controls are tracked in the mobile roadmap.</Text>
      </View>
    </Screen>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, { color }]}>{tabIcons[route.name]}</Text>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Proof" component={ProofScreen} />
        <Tab.Screen name="Add" component={AddScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 110, gap: spacing.md },
  flex: { flex: 1 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  eyebrow: { color: colors.primarySoft, fontSize: 11, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.4, marginBottom: spacing.sm },
  heroCard: { position: 'relative', overflow: 'hidden', backgroundColor: colors.surface, borderColor: 'rgba(56, 189, 248, 0.28)', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(168, 85, 247, 0.16)', top: -70, right: -55 },
  heroLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '900', maxWidth: '85%' },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  stat: { flex: 1, minHeight: 78, backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: radius.md, padding: spacing.sm, justifyContent: 'center' },
  statAccent: { backgroundColor: 'rgba(56, 189, 248, 0.10)' },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  statValueAccent: { color: colors.primary },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionHint: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '850' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  privacyLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(56, 189, 248, 0.10)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.22)' },
  pillViolet: { backgroundColor: 'rgba(168, 85, 247, 0.10)', borderColor: 'rgba(168, 85, 247, 0.26)' },
  pillSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.10)', borderColor: 'rgba(34, 197, 94, 0.22)' },
  pillText: { color: colors.primarySoft, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  pillTextViolet: { color: '#e9d5ff' },
  pillTextSuccess: { color: '#bbf7d0' },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionIconText: { color: colors.background, fontSize: 30, fontWeight: '600', marginTop: -2 },
  actionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 2 },
  chevron: { color: colors.primary, fontSize: 30, fontWeight: '300' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  captureCard: { backgroundColor: colors.surface, borderColor: 'rgba(56, 189, 248, 0.24)', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  fieldLabel: { color: colors.primarySoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  input: { minHeight: 58, color: colors.text, fontSize: 16, lineHeight: 22, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top' },
  inputTall: { minHeight: 80 },
  helperText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center' },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: colors.background, fontWeight: '900', fontSize: 15 },
  previewCard: { backgroundColor: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.28)', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  previewLabel: { color: '#e9d5ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: spacing.xs },
  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.36)', borderWidth: 1 },
  avatarText: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  profileName: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: spacing.xs },
  profileMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  toggle: { width: 50, height: 30, padding: 3, borderRadius: 15, justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.22)' },
  toggleActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text },
  toggleKnobActive: { alignSelf: 'flex-end', backgroundColor: colors.background },
  publicPreview: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  publicPreviewText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  securityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.22)', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  securityIcon: { width: 40, height: 40, textAlign: 'center', textAlignVertical: 'center', color: '#bbf7d0', fontSize: 22, fontWeight: '900', borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.12)' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  tabBar: { backgroundColor: '#0c1220', borderTopColor: colors.border, height: 82, paddingTop: 8, paddingBottom: 10 },
  tabLabel: { fontSize: 10, fontWeight: '800' },
  tabIconWrap: { minWidth: 32, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: 'rgba(56, 189, 248, 0.10)' },
  tabIcon: { fontSize: 18, fontWeight: '900' },
});
