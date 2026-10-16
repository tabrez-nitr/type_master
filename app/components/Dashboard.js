"use client";

import { useMemo } from "react";

// QWERTY keyboard layout rows for heatmap visualization
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function Dashboard({
  stats,
  onClose,
  onStartWeakKeysPractice,
  onClearStats,
}) {
  const {
    totalTests = 0,
    completedTests = 0,
    totalTimeSeconds = 0,
    totalErrors = 0,
    bestWpm = 0,
    avgWpm = 0,
    overallAccuracy = 100,
    wrongKeys = {},
    recentTests = [],
  } = stats || {};

  // Top missed keys sorted
  const sortedMissed = useMemo(() => {
    return Object.entries(wrongKeys)
      .sort((a, b) => b[1] - a[1]);
  }, [wrongKeys]);

  const maxMistakes = sortedMissed.length > 0 ? sortedMissed[0][1] : 1;
  const topThreeLetters = sortedMissed
    .filter(([k]) => k !== "space")
    .slice(0, 3)
    .map(([k]) => k.toUpperCase())
    .join(", ");

  // Heatmap helper for keyboard layout
  const getKeyHeatmapStyle = (char) => {
    const count = wrongKeys[char] || 0;
    if (count === 0) {
      return {
        background: "var(--bg-secondary)",
        color: "var(--text-untyped)",
        borderColor: "rgba(100, 102, 105, 0.2)",
      };
    }
    const ratio = Math.min(1, count / maxMistakes);
    if (ratio < 0.25) {
      return {
        background: "rgba(226, 183, 20, 0.15)",
        color: "var(--text-correct)",
        borderColor: "rgba(226, 183, 20, 0.4)",
      };
    }
    if (ratio < 0.6) {
      return {
        background: "rgba(202, 71, 84, 0.25)",
        color: "#f38ba8",
        borderColor: "rgba(202, 71, 84, 0.5)",
      };
    }
    return {
      background: "rgba(202, 71, 84, 0.45)",
      color: "#ffffff",
      borderColor: "var(--text-error)",
      boxShadow: "0 0 10px rgba(202, 71, 84, 0.4)",
    };
  };

  return (
    <div className="dashboard-overlay fade-in" onClick={onClose}>
      <div
        className="dashboard-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">
              Performance <span>&</span> Weak Keys
            </h2>
            <p className="dashboard-subtitle">
              Cumulative analytics stored in your browser
            </p>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            title="Close Dashboard (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="dash-metrics-grid">
          <div className="dash-metric-card">
            <span className="metric-val">{bestWpm}</span>
            <span className="metric-lbl">Best WPM</span>
          </div>
          <div className="dash-metric-card">
            <span className="metric-val">{avgWpm}</span>
            <span className="metric-lbl">Average WPM</span>
          </div>
          <div className="dash-metric-card">
            <span className="metric-val">{overallAccuracy}%</span>
            <span className="metric-lbl">All-Time Accuracy</span>
          </div>
          <div className="dash-metric-card">
            <span className="metric-val">{completedTests}</span>
            <span className="metric-lbl">Tests Finished</span>
          </div>
          <div className="dash-metric-card">
            <span className="metric-val" style={{ color: "var(--text-error)" }}>
              {totalErrors}
            </span>
            <span className="metric-lbl">Total Mistakes</span>
          </div>
          <div className="dash-metric-card">
            <span className="metric-val">
              {formatTime(totalTimeSeconds)}
            </span>
            <span className="metric-lbl">Time Typing</span>
          </div>
        </div>

        {/* Practice CTA Banner if mistakes exist */}
        {sortedMissed.length > 0 && (
          <div className="weak-keys-banner">
            <div className="banner-info">
              <span className="banner-tag">🎯 Targeted Training</span>
              <p className="banner-text">
                Your most frequent weak keys are{" "}
                <strong>{topThreeLetters || "detected keys"}</strong>. Practice them to build 100% precision.
              </p>
            </div>
            <button
              className="banner-cta-btn"
              onClick={() => {
                onStartWeakKeysPractice();
                onClose();
              }}
            >
              Practice Weak Keys Now
            </button>
          </div>
        )}

        {/* Keyboard Heatmap Section */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h3>Keyboard Error Heatmap</h3>
            <span className="heat-legend">
              <span className="legend-dot dot-clean" /> clean
              <span className="legend-dot dot-low" /> 1-3
              <span className="legend-dot dot-high" /> 4+ errors
            </span>
          </div>

          <div className="keyboard-heatmap">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className={`kb-row kb-row-${rIdx}`}>
                {row.map((char) => {
                  const style = getKeyHeatmapStyle(char);
                  const count = wrongKeys[char] || 0;
                  return (
                    <div
                      key={char}
                      className="kb-key"
                      style={style}
                      title={`${char.toUpperCase()}: ${count} mistake(s)`}
                    >
                      <span className="kb-char">{char}</span>
                      {count > 0 && <span className="kb-badge">{count}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Ranked Missed Keys & Recent Tests Grid */}
        <div className="dash-two-col">
          {/* Top Missed Keys List */}
          <div className="dash-card">
            <h4>Top Mistyped Keys</h4>
            {sortedMissed.length === 0 ? (
              <div className="empty-state">
                No mistakes recorded yet! Take a test to start tracking precision.
              </div>
            ) : (
              <div className="missed-ranked-list">
                {sortedMissed.slice(0, 8).map(([key, count], index) => {
                  const percent = totalErrors > 0 
                    ? Math.round((count / totalErrors) * 100) 
                    : 0;
                  return (
                    <div key={key} className="missed-rank-row">
                      <span className="rank-num">#{index + 1}</span>
                      <span className="rank-key">
                        {key === "space" ? "Space" : key}
                      </span>
                      <div className="rank-bar-bg">
                        <div
                          className="rank-bar-fill"
                          style={{
                            width: `${Math.max(8, (count / maxMistakes) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="rank-count">{count} misses</span>
                      <span className="rank-pct">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent History Table */}
          <div className="dash-card">
            <h4>Recent Test History</h4>
            {recentTests.length === 0 ? (
              <div className="empty-state">
                No completed tests yet. Start typing to see your progress!
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>WPM</th>
                      <th>Acc</th>
                      <th>Mistakes</th>
                      <th>Mode</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTests.slice(0, 7).map((t) => (
                      <tr key={t.id}>
                        <td className="wpm-cell">{t.wpm}</td>
                        <td className="acc-cell">{t.accuracy}%</td>
                        <td className="err-cell">{t.mistakes}</td>
                        <td className="mode-cell">{t.mode}</td>
                        <td className="time-cell">{t.duration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="dashboard-footer">
          <button
            className="clear-stats-btn"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to clear all your typing analytics and mistake history?"
                )
              ) {
                onClearStats();
              }
            }}
          >
            Clear Analytics Data
          </button>
          <button className="primary-btn" onClick={onClose}>
            Back to Practice
          </button>
        </div>
      </div>
    </div>
  );
}
