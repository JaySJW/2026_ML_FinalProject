// ==========================================
// HomeScreen
// ==========================================
// Main routine-generation screen.
// Collects Ideal State / Energy / Mood and calls the backend.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  loadUserProfile,
  appendSession,
  buildHistorySummary,
  buildInsightCard,
  wipeAll,
  seedDemoHistory,
} from '../utils/storage';

// ⚠️ CONFIG: change this to your PC's IPv4
const API_URL = 'http://10.131.4.65:8000/get-routine';

const MOOD_OPTIONS = [
  'Calm', 'Relaxed', 'Happy', 'Confident', 'Hopeful',
  'Stressed', 'Anxious', 'Overwhelm', 'Exhausted', 'Frustrated',
  'Sad', 'Lonely', 'Numb', 'Achy',
];
const MAX_MOODS = 3;

export default function HomeScreen({ navigation }) {
  const [idealState, setIdealState] = useState('');
  const [energy, setEnergy] = useState(5);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [checked, setChecked] = useState({});
  const [mode, setMode] = useState('');
  const [adaptedNote, setAdaptedNote] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [lastSessionSaved, setLastSessionSaved] = useState(false);
  const [insight, setInsight] = useState(null);
  const [baseMode, setBaseMode] = useState('');
  const [overridden, setOverridden] = useState(false);

  // Load saved profile once on mount
  useEffect(() => {
    (async () => {
      const p = await loadUserProfile();
      setUserProfile(p);
      const card = await buildInsightCard(7);
      setInsight(card);
    })();
  }, []);

  // Refresh insight whenever a session is saved
  const refreshInsight = async () => {
    const card = await buildInsightCard(7);
    setInsight(card);
  };

  const toggleMood = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== mood));
    } else {
      if (selectedMoods.length >= MAX_MOODS) {
        Alert.alert('Limit reached', `You can select up to ${MAX_MOODS} moods.`);
        return;
      }
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const toggleCheck = (index) => {
    setChecked({ ...checked, [index]: !checked[index] });
  };

  // Save the current session (call when user explicitly finishes)
  const saveSession = async () => {
    if (routines.length === 0) return;
    const checkedCount = Object.values(checked).filter(Boolean).length;
    const session = {
      date: new Date().toISOString(),
      energy,
      moods: selectedMoods,
      routines,
      checkedCount,
      totalCount: routines.length,
    };
    const ok = await appendSession(session);
    if (ok) {
      setLastSessionSaved(true);
      await refreshInsight();
      Alert.alert(
        'Saved ✓',
        "Today's session is recorded. Future routines will adapt from your pattern."
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset everything?',
      'This will delete your profile and all saved sessions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await wipeAll();
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  const handleSeedDemo = async () => {
    Alert.alert(
      'Load demo data?',
      'This will replace your session history with 7 fake days for demo purposes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            await seedDemoHistory();
            await refreshInsight();
            Alert.alert('Demo loaded ✓', 'Seven days of pattern are now in place.');
          },
        },
      ]
    );
  };

  const getRoutine = async () => {
    setLoading(true);
    setRoutines([]);
    setChecked({});
    setMode('');
    setAdaptedNote(null);
    setLastSessionSaved(false);

    try {
      // Pull recent pattern summary (if any)
      const historySummary = await buildHistorySummary(7);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideal_state: idealState,
          energy_level: energy,
          moods: selectedMoods,
          user_profile: userProfile || undefined,
          history_summary: historySummary || undefined,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setRoutines(data.routines || []);
      setMode(data.mode || '');
      setBaseMode(data.base_mode || '');
      setOverridden(!!data.overridden);
      setAdaptedNote(data.adapted_note || null);
    } catch (err) {
      Alert.alert(
        'Connection problem',
        `Could not reach the AI server.\n\nDetails: ${err.message}\n\n` +
          `• Is the backend running?\n` +
          `• Is your phone on the same Wi-Fi as your PC?\n` +
          `• Is the IP address correct?`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🌱 My Personalized Routine Maker</Text>
        {userProfile?.name ? (
          <Text style={styles.greeting}>Hi, {userProfile.name} 👋</Text>
        ) : null}
        <Text style={styles.subtitle}>
          Describe your ideal self, tell me how you're feeling today, and I'll
          bridge the gap with a manageable routine.
        </Text>

        {insight && (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📊 Your recent pattern</Text>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{insight.daysTracked}</Text>
                <Text style={styles.insightLabel}>days</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{insight.avgEnergy}</Text>
                <Text style={styles.insightLabel}>avg energy</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>
                  {insight.completionRate !== null ? `${insight.completionRate}%` : '—'}
                </Text>
                <Text style={styles.insightLabel}>completed</Text>
              </View>
            </View>
            {insight.topMoods.length > 0 && (
              <Text style={styles.insightMoods}>
                Frequent moods: {insight.topMoods.join(', ')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ My Ideal State</Text>
          <Text style={styles.hint}>What does your ideal life, mindset, or day look like?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., I want to be a calm person who consistently works on my art portfolio."
            placeholderTextColor="#999"
            multiline
            value={idealState}
            onChangeText={setIdealState}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Energy Level</Text>
          <Text style={styles.energyValue}>{energy} / 10</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#4CAF50"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Empty</Text>
            <Text style={styles.sliderLabel}>Full</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Current Mood</Text>
          <Text style={styles.hint}>
            Select up to {MAX_MOODS} ({selectedMoods.length}/{MAX_MOODS} selected)
          </Text>
          <View style={styles.chipContainer}>
            {MOOD_OPTIONS.map((mood) => {
              const active = selectedMoods.includes(mood);
              return (
                <TouchableOpacity
                  key={mood}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleMood(mood)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={getRoutine}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Get Today's Custom Routine</Text>
          )}
        </TouchableOpacity>

        {routines.length > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>📝 Today's Micro-Steps</Text>
            {mode ? (
              <View style={styles.modeRow}>
                <Text style={styles.modeTag}>{mode}</Text>
                {overridden && baseMode ? (
                  <Text style={styles.modeBaseTag}>
                    (adjusted from {baseMode})
                  </Text>
                ) : null}
              </View>
            ) : null}
            {adaptedNote ? (
              <View style={styles.adaptedBox}>
                <Text style={styles.adaptedText}>✨ {adaptedNote}</Text>
              </View>
            ) : null}
            {routines.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.checkRow} onPress={() => toggleCheck(idx)}>
                <View style={[styles.checkbox, checked[idx] && styles.checkboxChecked]}>
                  {checked[idx] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkLabel, checked[idx] && styles.checkLabelDone]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, lastSessionSaved && styles.saveBtnDone]}
              onPress={saveSession}
              disabled={lastSessionSaved}
            >
              <Text style={styles.saveBtnText}>
                {lastSessionSaved ? 'Saved ✓' : 'Save Today\'s Session'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.devRow}>
          <TouchableOpacity style={styles.devBtn} onPress={handleSeedDemo}>
            <Text style={styles.devBtnText}>Load demo data</Text>
          </TouchableOpacity>
          <Text style={styles.devSeparator}>·</Text>
          <TouchableOpacity style={styles.devBtn} onPress={handleReset}>
            <Text style={styles.devBtnText}>Reset profile & data</Text>
          </TouchableOpacity>
        </View>

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
  title: { fontSize: 24, fontWeight: '700', color: '#1F2A22', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#555', marginTop: 6, marginBottom: 20, lineHeight: 20 },
  greeting: { fontSize: 15, color: '#4CAF50', fontWeight: '600', marginTop: 6},
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2A22', marginBottom: 6 },
  hint: { fontSize: 13, color: '#777', marginBottom: 10 },
  textInput: {
    borderWidth: 1, borderColor: '#DCDCD2', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, fontSize: 14, minHeight: 90,
    textAlignVertical: 'top', color: '#1F2A22',
  },
  energyValue: { fontSize: 22, fontWeight: '700', color: '#4CAF50', marginBottom: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  sliderLabel: { fontSize: 12, color: '#999' },
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
    alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultBox: {
    marginTop: 26, padding: 18, backgroundColor: '#F1F6EE',
    borderRadius: 14, borderWidth: 1, borderColor: '#DCE7D3',
  },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#1F2A22', marginBottom: 4 },
  modeTag: {
    alignSelf: 'flex-start', fontSize: 11, fontWeight: '700',
    color: '#4CAF50', letterSpacing: 0.6, marginBottom: 14,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#4CAF50', marginRight: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#4CAF50' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  checkLabel: { flex: 1, fontSize: 15, color: '#1F2A22' },
  checkLabelDone: { textDecorationLine: 'line-through', color: '#999' },

  adaptedBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    marginBottom: 12,
  },
  adaptedText: {
    fontSize: 13,
    color: '#2E5A36',
    lineHeight: 18,
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveBtnDone: {
    backgroundColor: '#9CCFA0',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E4E8E0',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A22',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
  },
  insightLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  insightMoods: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  modeBaseTag: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
    letterSpacing: 0.3,
  },

  devRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  devBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  devBtnText: {
    fontSize: 12,
    color: '#BBB',
    textDecorationLine: 'underline',
  },
  devSeparator: {
    fontSize: 12,
    color: '#DDD',
    marginHorizontal: 4,
  },


});

