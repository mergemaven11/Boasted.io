import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, navigationTheme, radius, spacing } from './src/theme';

const Tab = createBottomTabNavigator();

function Screen({ eyebrow, title, children }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, body, value }) {
  return (
    <View style={styles.card}>
      {value ? <Text style={styles.metric}>{value}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function HomeScreen() {
  return (
    <Screen eyebrow="Your career proof" title="BragStack in your pocket.">
      <Card value="12" title="Impact Receipts" body="Keep wins, measurable results, evidence, skills, and credit together." />
      <Card title="This week" body="Capture one result while the details are still fresh." />
    </Screen>
  );
}

function AccomplishmentsScreen() {
  return (
    <Screen eyebrow="Proof library" title="Accomplishments">
      <Card title="Reduced incident recovery time" body="Result: 32% faster recovery • Evidence attached • Private" />
      <Card title="Automated release checks" body="Contribution: platform tooling • Credit: shared with team" />
    </Screen>
  );
}

function AddScreen() {
  return (
    <Screen eyebrow="Quick capture" title="Add a win">
      <Card title="Impact Receipt" body="Accomplishment → Contribution → Result → Evidence → Skills → Credit." />
      <Pressable style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Start capture</Text>
      </Pressable>
    </Screen>
  );
}

function ProfileScreen() {
  return (
    <Screen eyebrow="Professional story" title="Profile">
      <Card title="Public profile" body="Control what is visible. Workplace evidence stays private unless you explicitly share it." />
    </Screen>
  );
}

function SettingsScreen() {
  return (
    <Screen eyebrow="Account" title="Settings">
      <Card title="Privacy first" body="Secure session storage, explicit sharing, and no unnecessary device permissions." />
      <Card title="Appearance" body="BragStack dark theme with sky-blue and violet accents." />
    </Screen>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Accomplishments" component={AccomplishmentsScreen} />
        <Tab.Screen name="Add" component={AddScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { padding: spacing.lg, gap: spacing.md },
  eyebrow: { color: colors.primarySoft, fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 38, lineHeight: 42, fontWeight: '900', letterSpacing: -1.5, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  metric: { color: colors.primary, fontSize: 34, fontWeight: '900' },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.background, fontWeight: '900', fontSize: 16 },
  tabBar: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 74, paddingTop: 8, paddingBottom: 10 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
});
