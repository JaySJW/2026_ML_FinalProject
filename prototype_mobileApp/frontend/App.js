// ==========================================
// ADHD Routine AI - Mobile App (Frontend)
// ==========================================
// React Native UI that collects the user's ideal state,
// current energy (0-10), and mood tags (up to 3),
// then calls the FastAPI backend to generate a
// CBT-based micro-routine tailored to today's capacity.
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
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';

// ------------------------------------------
// ⚠️ CONFIG: change this to your PC's IPv4
// ------------------------------------------
const API_URL = 'http://10.131.4.65:8000/get-routine';

// ------------------------------------------
// Mood options (same 14 as the web prototype)
// ------------------------------------------
const MOOD_OPTIONS = [
  'Calm', 'Relaxed', 'Happy', 'Confident', 'Hopeful',
  'Stressed', 'Anxious', 'Overwhelm', 'Exhausted', 'Frustrated',
  'Sad', 'Lonely', 'Numb', 'Achy',
];

const MAX_MOODS = 3;

export default function App() {
  // --- State ---
  const [idealState, setIdealState] = useState('');
  const [energy, setEnergy] = useState(5);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [checked, setChecked] = useState({});
  const [mode, setMode] = useState('');

  // --- Mood chip toggle (max 3) ---
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

  // --- Toggle check on a generated routine item ---
  const toggleCheck = (index) => {
    setChecked({ ...checked, [index]: !checked[index] });
  };

  // --- Main: call backend and render routines ---
  const getRoutine = async () => {
    setLoading(true);
    setRoutines([]);
    setChecked({});
    setMode('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideal_state: idealState,
          energy_level: energy,
          moods: selectedMoods,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setRoutines(data.routines || []);
      setMode(data.mode || '');
    } catch (err) {
      Alert.alert(
        'Connection problem',
        `Could not reach the AI server.\n\nDetails: ${err.message}\n\n` +
          `• Is the backend running?\n` +
          `• Is your phone on the same Wi-Fi as your PC?\n` +
          `• Is the IP address in App.js correct?`
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>🌱 My Personalized Routine Maker</Text>
        <Text style={styles.subtitle}>
          Describe your ideal self, tell me how you're feeling today, and I'll
          bridge the gap with a manageable routine.
        </Text>

        {/* Ideal State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ My Ideal State</Text>
          <Text style={styles.hint}>
            What does your ideal life, mindset, or day look like?
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., I want to be a calm person who consistently works on my art portfolio without feeling rushed."
            placeholderTextColor="#999"
            multiline
            value={idealState}
            onChangeText={setIdealState}
          />
        </View>

        {/* Energy Slider */}
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

        {/* Mood Chips */}
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

        {/* Submit button */}
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

        {/* Results */}
        {routines.length > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>📝 Today's Micro-Steps</Text>
            {mode ? <Text style={styles.modeTag}>{mode}</Text> : null}
            {routines.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.checkRow}
                onPress={() => toggleCheck(idx)}
              >
                <View style={[styles.checkbox, checked[idx] && styles.checkboxChecked]}>
                  {checked[idx] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.checkLabel,
                    checked[idx] && styles.checkLabelDone,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A22',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A22',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: '#777',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DCDCD2',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    color: '#1F2A22',
  },
  energyValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCDCD2',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#1F2A22',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 26,
    padding: 18,
    backgroundColor: '#F1F6EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE7D3',
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2A22',
    marginBottom: 4,
  },
  modeTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1F2A22',
  },
  checkLabelDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});