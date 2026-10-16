/**
 * LocalStorage manager for TypeMaster analytics, mistake tracking,
 * and weak keys practice.
 */

const STORAGE_KEY = "typemaster_analytics_v2";

const DEFAULT_STATS = {
  totalTests: 0,
  completedTests: 0,
  totalTimeSeconds: 0,
  totalKeystrokes: 0,
  totalErrors: 0,
  bestWpm: 0,
  avgWpm: 0,
  overallAccuracy: 100,
  wrongKeys: {}, // { [char]: count }
  recentTests: [], // Array of test summary objects (latest 20)
};

/**
 * Safely load stats from localStorage.
 */
export function getStoredStats() {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      wrongKeys: parsed.wrongKeys || {},
      recentTests: parsed.recentTests || [],
    };
  } catch (err) {
    console.error("Failed to load stats from localStorage", err);
    return DEFAULT_STATS;
  }
}

/**
 * Save updated stats to localStorage.
 */
export function saveStats(stats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error("Failed to save stats to localStorage", err);
  }
}

/**
 * Record a completed test session into localStorage.
 * Updates totals, averages, best WPM, and adds missed keys to the cumulative tally.
 */
export function recordTestSession({
  wpm = 0,
  rawWpm = 0,
  accuracy = 100,
  mistakes = 0,
  duration = 0,
  mode = "time 30",
  practiceType = "random",
  missedKeys = {},
  keystrokes = 0,
}) {
  const current = getStoredStats();

  const newTotalTests = current.totalTests + 1;
  const newCompleted = current.completedTests + 1;
  const newTotalTime = current.totalTimeSeconds + Math.round(duration);
  const newTotalKeystrokes = current.totalKeystrokes + keystrokes;
  const newTotalErrors = current.totalErrors + mistakes;
  const newBestWpm = Math.max(current.bestWpm, wpm);

  // Merge wrongKeys
  const updatedWrongKeys = { ...current.wrongKeys };
  Object.entries(missedKeys).forEach(([key, count]) => {
    const normalizedKey = key.toLowerCase();
    updatedWrongKeys[normalizedKey] = (updatedWrongKeys[normalizedKey] || 0) + count;
  });

  // Calculate new average WPM
  const previousWpmSum = current.avgWpm * current.completedTests;
  const newAvgWpm = Math.round((previousWpmSum + wpm) / newCompleted);

  // Calculate overall accuracy
  const totalAttempts = newTotalKeystrokes + newTotalErrors;
  const newOverallAcc = totalAttempts > 0 
    ? Math.round((newTotalKeystrokes / totalAttempts) * 100) 
    : 100;

  // New recent test entry
  const testEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    wpm,
    rawWpm,
    accuracy,
    mistakes,
    duration: Math.round(duration),
    mode,
    practiceType,
    topMistakes: Object.entries(missedKeys)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, c]) => `${k}:${c}`),
  };

  const updatedRecent = [testEntry, ...current.recentTests].slice(0, 30);

  const updatedStats = {
    totalTests: newTotalTests,
    completedTests: newCompleted,
    totalTimeSeconds: newTotalTime,
    totalKeystrokes: newTotalKeystrokes,
    totalErrors: newTotalErrors,
    bestWpm: newBestWpm,
    avgWpm: newAvgWpm,
    overallAccuracy: newOverallAcc,
    wrongKeys: updatedWrongKeys,
    recentTests: updatedRecent,
  };

  saveStats(updatedStats);
  return updatedStats;
}

/**
 * Get top N weak keys sorted by error frequency.
 */
export function getTopWeakKeys(limit = 6) {
  const stats = getStoredStats();
  return Object.entries(stats.wrongKeys)
    .filter(([k]) => k !== "space") // focus on alphabetical / punctuation keys for word generation
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

/**
 * Clear all stored stats and start fresh.
 */
export function clearAllStats() {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear stats", err);
  }
  return DEFAULT_STATS;
}
