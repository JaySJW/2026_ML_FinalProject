// ==========================================
// OnboardingScreen
// ==========================================
// First-launch setup.
// Collects 6 pieces of background information that will be
// injected into the AI prompt to personalise routines.
// ==========================================

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { saveUserProfile } from '../utils/storage';

// ------------------------------------------
// Options
// ------------------------------------------
const AGE_RANGES = ['Teens', '20s', '30s', '40s+'];

const CHALLENGES = [
  'ADHD (diagnosed)',
  'ADHD (suspected)',
  'Autism / ASD',
  'Anxiety',
  'Depression',
  'Learning difficulty',
  'Burnout',
  'Prefer not to say',
];

const ROLES = ['Student', 'Working professional', 'Freelancer / Creative', 'Between things'];

const DRAINS = [
  'Social interactions',
  'Decision making',
  'Unexpected changes',
  'Sensory overload',
  'Long focus tasks',
  'Emotional labour',
];

const GROUNDS = [
  'Nature / outdoors',
  'Music',
  'Movement',
  'Creating something',
  'Pets / animals',
  'Journaling',
  'Alone time',
  'Close friends',
];

const MAX_MULTI = 3;

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [role, setRole] = useState('');
  const [drains, setDrains] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [saving, setSaving] = useState(false);

  // ---- Single-choice toggler ----
  const pickSingle = (setter, value, current) => {
    setter(current === value ? '' : value);
  };

  // ---- Multi-choice toggler (with limit) ----
  const pickMulti = (setter, current, value, limit = MAX_MULTI) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      if (current.length >= limit) {
        Alert.alert('Limit reached', `You can select up to ${limit}.`);
        return;
      }
      setter([...current, value]);
    }
  };

  // ---- Submit ----
  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Almost there', 'Please enter a name or nickname.');
      return;
    }
    setSaving(true);
    const profile = {
      name: name.trim(),
      age_range: ageRange,
      challenges,
      role,
      drains,
      grounds,
      created_at: new Date().toISOString(),
    };
    const ok = await saveUserProfile(profile);
    setSaving(false);
    if (ok) {
      navigation.replace('Home');
    } else {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  // ---- Reusable chip renderer ----
  const renderChips = (options, selected, onPress, isMulti = false) => (
    <View style={styles.chipContainer}>
      {options.map((opt) => {
        const active = isMulti ? selected.includes(opt) : selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onPress(opt)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>Let's get to know you</Text>
        <Text style={styles.subtitle}>
          A few quick questions so your routines can be tailored to you.
          All data stays on your device.
        </Text>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What should we call you?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Name or nickname"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Age */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age range</Text>
          {renderChips(AGE_RANGES, ageRange, (v) => pickSingle(setAgeRange, v, ageRange))}
        </View>

        {/* Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you navigating?</Text>
          <Text style={styles.hint}>Select up to {MAX_MULTI}</Text>
          {renderChips(
            CHALLENGES,
            challenges,
            (v) => pickMulti(setChallenges, challenges, v),
            true
          )}
        </View>

        {/* Role */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current main role</Text>
          {renderChips(ROLES, role, (v) => pickSingle(setRole, v, role))}
        </View>

        {/* Drains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What usually drains you?</Text>
          <Text style={styles.hint}>Select up to {MAX_MULTI}</Text>
          {renderChips(DRAINS, drains, (v) => pickMulti(setDrains, drains, v), true)}
        </View>

        {/* Grounds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What usually grounds you?</Text>
          <Text style={styles.hint}>Select up to {MAX_MULTI}</Text>
          {renderChips(GROUNDS, grounds, (v) => pickMulti(setGrounds, grounds, v), true)}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleContinue}
          disabled={saving}
        >
          <Text style={styles.submitBtnText}>
            {saving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { padding: 20 },
  emoji: { fontSize: 40, textAlign: 'left', marginTop: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2A22', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#555', marginTop: 6, marginBottom: 24, lineHeight: 20 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1F2A22', marginBottom: 8 },
  hint: { fontSize: 12, color: '#888', marginBottom: 8 },
  textInput: {
    borderWidth: 1, borderColor: '#DCDCD2', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#1F2A22',
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#DCDCD2', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#1F2A22', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});