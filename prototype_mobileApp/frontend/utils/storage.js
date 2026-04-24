// ==========================================
// AsyncStorage utility
// ==========================================
// Centralised wrappers for reading/writing persistent data.
// Keys are defined here so we don't scatter string literals.
// ==========================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Keys ---
export const KEYS = {
  USER_PROFILE: 'user_profile',
  SESSION_HISTORY: 'session_history',
};

// --- User profile (onboarding data) ---
export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (err) {
    console.error('saveUserProfile failed:', err);
    return false;
  }
};

export const loadUserProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('loadUserProfile failed:', err);
    return null;
  }
};

export const clearUserProfile = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.USER_PROFILE);
    return true;
  } catch (err) {
    console.error('clearUserProfile failed:', err);
    return false;
  }
};

// --- Session history (routine generations) ---
// Each session: { date, energy, moods, routines, checkedCount, totalCount }
export const appendSession = async (session) => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_HISTORY);
    const history = raw ? JSON.parse(raw) : [];
    history.push(session);
    // Keep only the last 30 sessions to avoid unbounded growth
    const trimmed = history.slice(-30);
    await AsyncStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(trimmed));
    return true;
  } catch (err) {
    console.error('appendSession failed:', err);
    return false;
  }
};

export const loadSessionHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('loadSessionHistory failed:', err);
    return [];
  }
};

export const clearSessionHistory = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.SESSION_HISTORY);
    return true;
  } catch (err) {
    console.error('clearSessionHistory failed:', err);
    return false;
  }
};

// --- Dev helper: wipe everything ---
export const wipeAll = async () => {
  await clearUserProfile();
  await clearSessionHistory();
};

// ==========================================
// History analysis helpers
// ==========================================

// Get last N days of sessions
export const getRecentSessions = async (days = 7) => {
  const history = await loadSessionHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return history.filter((s) => new Date(s.date) >= cutoff);
};

// Build a compact summary to send to the backend.
// The backend will inject this into the prompt.
export const buildHistorySummary = async (days = 7) => {
  const sessions = await getRecentSessions(days);

  if (sessions.length === 0) {
    return null; // no history yet
  }

  // Average energy
  const avgEnergy =
    sessions.reduce((sum, s) => sum + (s.energy ?? 0), 0) / sessions.length;

  // Mood frequency
  const moodCount = {};
  sessions.forEach((s) => {
    (s.moods || []).forEach((m) => {
      moodCount[m] = (moodCount[m] || 0) + 1;
    });
  });
  const topMoods = Object.entries(moodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, c]) => `${m} (${c}x)`);

  // Completion rate
  let totalChecked = 0;
  let totalItems = 0;
  sessions.forEach((s) => {
    totalChecked += s.checkedCount ?? 0;
    totalItems += s.totalCount ?? 0;
  });
  const completionRate =
    totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : null;

  return {
    days_tracked: sessions.length,
    avg_energy: parseFloat(avgEnergy.toFixed(1)),
    top_moods: topMoods,
    completion_rate: completionRate,
  };
};

// ==========================================
// Insight data for the Home screen card
// ==========================================
// Same underlying data as buildHistorySummary(), but returns
// a richer structure that the UI can render directly.
// ==========================================
export const buildInsightCard = async (days = 7) => {
  const sessions = await getRecentSessions(days);
  if (sessions.length === 0) return null;

  const avgEnergy =
    sessions.reduce((sum, s) => sum + (s.energy ?? 0), 0) / sessions.length;

  const moodCount = {};
  sessions.forEach((s) => {
    (s.moods || []).forEach((m) => {
      moodCount[m] = (moodCount[m] || 0) + 1;
    });
  });
  const topMoods = Object.entries(moodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m);

  let totalChecked = 0;
  let totalItems = 0;
  sessions.forEach((s) => {
    totalChecked += s.checkedCount ?? 0;
    totalItems += s.totalCount ?? 0;
  });
  const completionRate =
    totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : null;

  return {
    daysTracked: sessions.length,
    avgEnergy: parseFloat(avgEnergy.toFixed(1)),
    topMoods,
    completionRate,
  };
};

// ==========================================
// Demo seed (for video/screenshot/demo purposes)
// ==========================================
// Populates the session history with 7 fake days so that
// the Insight Card and Adaptive Override features can be
// demonstrated immediately, without needing several real
// sessions to accumulate.
// ==========================================
export const seedDemoHistory = async () => {
  const today = new Date();
  const demoSessions = [];

  // 7 days of varied-but-low-completion data to trigger override
  const presets = [
    { daysAgo: 6, energy: 3, moods: ['Anxious', 'Exhausted'], checked: 1, total: 3 },
    { daysAgo: 5, energy: 4, moods: ['Stressed'],             checked: 0, total: 3 },
    { daysAgo: 4, energy: 5, moods: ['Overwhelm', 'Anxious'], checked: 1, total: 3 },
    { daysAgo: 3, energy: 2, moods: ['Numb'],                 checked: 0, total: 3 },
    { daysAgo: 2, energy: 4, moods: ['Anxious', 'Sad'],       checked: 1, total: 3 },
    { daysAgo: 1, energy: 3, moods: ['Exhausted'],            checked: 1, total: 3 },
    { daysAgo: 0, energy: 4, moods: ['Anxious'],              checked: 0, total: 3 },
  ];

  presets.forEach((p) => {
    const d = new Date(today);
    d.setDate(d.getDate() - p.daysAgo);
    demoSessions.push({
      date: d.toISOString(),
      energy: p.energy,
      moods: p.moods,
      routines: [
        '🌬️ Breathe slowly',
        '💧 Sip water',
        '🪑 Sit still a moment',
      ],
      checkedCount: p.checked,
      totalCount: p.total,
    });
  });

  try {
    await AsyncStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(demoSessions));
    return true;
  } catch (err) {
    console.error('seedDemoHistory failed:', err);
    return false;
  }
};