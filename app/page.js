"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { generateWords } from "./lib/words";
import { playErrorSound, playClickSound } from "./lib/audio";
import {
  getStoredStats,
  recordTestSession,
  getTopWeakKeys,
  clearAllStats,
} from "./lib/storage";
import Dashboard from "./components/Dashboard";

// ── SVG Icons ──
const IconKeyboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/>
  </svg>
);

const IconVolume = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const IconMute = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6"/>
    <path d="M2.5 11.5a10 10 0 0 1 18.2-4.5M21.5 12.5a10 10 0 0 1-18.2 4.5"/>
  </svg>
);

const IconClick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconTarget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// ── Mode constants ──
const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [25, 50, 100];

// Extra words buffer for time mode
const TIME_MODE_WORD_COUNT = 450;

export default function Home() {
  // ── Practice Section State ──
  const [practiceType, setPracticeType] = useState("random"); // "random" | "weak_keys"
  const [showDashboard, setShowDashboard] = useState(false);
  const [stats, setStats] = useState(null);

  // ── Test Mode State ──
  const [mode, setMode] = useState("time"); // "time" | "words"
  const [timeOption, setTimeOption] = useState(30);
  const [wordOption, setWordOption] = useState(50);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);

  // ── Typing Engine State ──
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // current char index in flat string
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [focused, setFocused] = useState(true);

  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [missedKeys, setMissedKeys] = useState({});
  const [charStates, setCharStates] = useState([]); // per-char state: null | 'correct' | 'error' | 'corrected'
  const [currentCharError, setCurrentCharError] = useState(false);
  const [shakingWord, setShakingWord] = useState(-1);

  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [clickSound, setClickSound] = useState(false);

  const typingRef = useRef(null);
  const caretRef = useRef(null);
  const wordsInnerRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const charErrorOnCurrent = useRef(false);
  const testRecordedRef = useRef(false);

  // Load stats from localStorage on mount
  useEffect(() => {
    setStats(getStoredStats());
  }, []);

  // Top weak keys list from stats
  const weakKeysList = useMemo(() => {
    if (!stats || !stats.wrongKeys) return [];
    return Object.entries(stats.wrongKeys)
      .filter(([k]) => k !== "space")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));
  }, [stats]);

  // ── Flat text from words ──
  const flatText = useMemo(() => words.join(" "), [words]);

  // ── Map: flat index → { wordIdx, charIdx } ──
  const indexMap = useMemo(() => {
    const map = [];
    let fi = 0;
    for (let w = 0; w < words.length; w++) {
      for (let c = 0; c < words[w].length; c++) {
        map.push({ wordIdx: w, charIdx: c });
        fi++;
      }
      if (w < words.length - 1) {
        map.push({ wordIdx: w, charIdx: words[w].length }); // space
        fi++;
      }
    }
    return map;
  }, [words]);

  // ── Initialize words ──
  const initWords = useCallback(() => {
    const count = mode === "time" ? TIME_MODE_WORD_COUNT : wordOption;

    // Determine target letters for weak keys practice
    let targetLetters = [];
    if (practiceType === "weak_keys") {
      const stored = getStoredStats();
      const topWeak = Object.entries(stored.wrongKeys || {})
        .filter(([k]) => k !== "space")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k);

      if (topWeak.length > 0) {
        targetLetters = topWeak;
      } else {
        // Fallback tricky letters if no mistakes recorded yet
        targetLetters = ["q", "z", "x", "p", "b", "j"];
      }
    }

    const newWords = generateWords(count, punctuation, numbers, targetLetters);
    setWords(newWords);
    setCurrentIndex(0);
    setStarted(false);
    setFinished(false);
    setCorrectCount(0);
    setErrorCount(0);
    setMissedKeys({});
    setCharStates([]);
    setCurrentCharError(false);
    setShakingWord(-1);
    setElapsed(0);
    setRemaining(mode === "time" ? timeOption : 0);
    charErrorOnCurrent.current = false;
    testRecordedRef.current = false;

    if (wordsInnerRef.current) {
      wordsInnerRef.current.style.transform = "translateY(0px)";
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, [mode, timeOption, wordOption, punctuation, numbers, practiceType]);

  useEffect(() => {
    initWords();
  }, [initWords]);

  // ── Focus management ──
  useEffect(() => {
    if (typingRef.current && !finished && !showDashboard) {
      typingRef.current.focus();
    }
  }, [finished, words, showDashboard]);

  // ── Timer ──
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();

    if (mode === "time") {
      setRemaining(timeOption);
      timerRef.current = setInterval(() => {
        const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
        setElapsed(elapsedSec);
        const rem = Math.max(0, timeOption - elapsedSec);
        setRemaining(rem);
        if (rem <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setFinished(true);
        }
      }, 100);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed((performance.now() - startTimeRef.current) / 1000);
      }, 100);
    }
  }, [mode, timeOption]);

  // ── Cleanup timer ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── End test for word mode ──
  useEffect(() => {
    if (mode === "words" && started && currentIndex >= flatText.length && !finished) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFinished(true);
    }
  }, [currentIndex, flatText.length, mode, started, finished]);

  // ── Calculate words completed ──
  const wordsCompleted = useMemo(() => {
    if (currentIndex === 0) return 0;
    const typed = flatText.substring(0, currentIndex);
    return typed.split(" ").length - (typed.endsWith(" ") ? 0 : 1);
  }, [currentIndex, flatText]);

  // ── WPM & Accuracy ──
  const currentWpm = useMemo(() => {
    if (elapsed < 1) return 0;
    return Math.round((correctCount / 5) / (elapsed / 60));
  }, [correctCount, elapsed]);

  const rawWpm = useMemo(() => {
    if (elapsed < 1) return 0;
    return Math.round(((correctCount + errorCount) / 5) / (elapsed / 60));
  }, [correctCount, errorCount, elapsed]);

  const accuracy = useMemo(() => {
    const total = correctCount + errorCount;
    if (total === 0) return 100;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, errorCount]);

  // ── Record test session into localStorage once test completes ──
  useEffect(() => {
    if (finished && !testRecordedRef.current && correctCount > 0) {
      testRecordedRef.current = true;
      const modeLabel = `${mode} ${mode === "time" ? timeOption : wordOption}`;
      const updated = recordTestSession({
        wpm: currentWpm,
        rawWpm,
        accuracy,
        mistakes: errorCount,
        duration: elapsed,
        mode: modeLabel,
        practiceType,
        missedKeys,
        keystrokes: correctCount,
      });
      setStats(updated);
    }
  }, [
    finished,
    currentWpm,
    rawWpm,
    accuracy,
    errorCount,
    elapsed,
    mode,
    timeOption,
    wordOption,
    practiceType,
    missedKeys,
    correctCount,
  ]);

  // ── Caret positioning (Underline Caret below the letter) ──
  const updateCaret = useCallback(() => {
    if (!caretRef.current || !wordsInnerRef.current) return;

    const charEls = wordsInnerRef.current.querySelectorAll(".char");
    const targetEl = charEls[currentIndex];

    if (targetEl) {
      const innerRect = wordsInnerRef.current.getBoundingClientRect();
      const charRect = targetEl.getBoundingClientRect();

      const left = charRect.left - innerRect.left;
      // Position the underline bar right at the bottom edge of the letter
      const top = charRect.bottom - innerRect.top - 2;
      const width = charRect.width > 0 ? charRect.width : 16;

      caretRef.current.style.opacity = "1";
      caretRef.current.style.left = `${left}px`;
      caretRef.current.style.top = `${top}px`;
      caretRef.current.style.width = `${width}px`;
    } else if (charEls.length > 0 && currentIndex >= charEls.length) {
      const lastEl = charEls[charEls.length - 1];
      const innerRect = wordsInnerRef.current.getBoundingClientRect();
      const charRect = lastEl.getBoundingClientRect();
      const left = charRect.right - innerRect.left;
      const top = charRect.bottom - innerRect.top - 2;
      const width = charRect.width > 0 ? charRect.width : 16;

      caretRef.current.style.opacity = "1";
      caretRef.current.style.left = `${left}px`;
      caretRef.current.style.top = `${top}px`;
      caretRef.current.style.width = `${width}px`;
    }
  }, [currentIndex]);

  useEffect(() => {
    updateCaret();
  }, [currentIndex, updateCaret, words]);

  // Observer for layout changes
  useEffect(() => {
    const raf = requestAnimationFrame(updateCaret);
    return () => cancelAnimationFrame(raf);
  }, [updateCaret, charStates]);

  // Update on window resize
  useEffect(() => {
    const handleResize = () => updateCaret();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCaret]);

  // ── Line scrolling ──
  useEffect(() => {
    if (!wordsInnerRef.current) return;

    const wordEls = wordsInnerRef.current.querySelectorAll(".word");
    if (!wordEls.length) return;

    const currentWordIdx = indexMap[currentIndex]?.wordIdx ?? 0;
    const currentWordEl = wordEls[currentWordIdx];
    if (!currentWordEl) return;

    const firstWordTop = wordEls[0].offsetTop;

    // Measure line height from wrapped words in the DOM
    let measuredLineHeight = 0;
    for (let i = 1; i < wordEls.length; i++) {
      if (wordEls[i].offsetTop > firstWordTop + 10) {
        measuredLineHeight = wordEls[i].offsetTop - firstWordTop;
        break;
      }
    }

    if (!measuredLineHeight) {
      measuredLineHeight = parseFloat(getComputedStyle(wordsInnerRef.current).lineHeight) || 61;
    }

    // Determine which line the current word is on (0-indexed)
    const currentLineIndex = Math.round((currentWordEl.offsetTop - firstWordTop) / measuredLineHeight);

    // In a 3-line view:
    // Keep first 2 lines in view (lines 0 and 1) without scroll (linesToScroll = 0)
    // Starting on line 2 (the 3rd line), scroll up so the active line stays centered
    const linesToScroll = Math.max(0, currentLineIndex - 1);
    const scrollY = linesToScroll * measuredLineHeight;

    wordsInnerRef.current.style.transform = linesToScroll === 0 ? "translateY(0px)" : `translateY(-${scrollY}px)`;

    requestAnimationFrame(updateCaret);
  }, [currentIndex, indexMap, updateCaret]);

  // ── Key handler ──
  const handleKeyDown = useCallback(
    (e) => {
      // If dashboard is open, Escape closes it
      if (showDashboard) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowDashboard(false);
        }
        return;
      }

      if (finished) return;

      // Quick restart: Tab+Enter or Escape
      if (e.key === "Escape" || (e.key === "Enter" && e.getModifierState("Tab"))) {
        e.preventDefault();
        initWords();
        return;
      }

      // Tab hint
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      // Ignore modifier-only keys and special keys
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock" ||
        e.key === "Backspace" ||
        e.key === "Enter" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Delete" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "PageUp" ||
        e.key === "PageDown" ||
        e.key === "Insert" ||
        e.key === "F1" ||
        e.key === "F2" ||
        e.key === "F3" ||
        e.key === "F4" ||
        e.key === "F5" ||
        e.key === "F6" ||
        e.key === "F7" ||
        e.key === "F8" ||
        e.key === "F9" ||
        e.key === "F10" ||
        e.key === "F11" ||
        e.key === "F12" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      e.preventDefault();

      if (currentIndex >= flatText.length) return;

      // Start timer on first keystroke
      if (!started) {
        setStarted(true);
        startTimer();
      }

      const expectedChar = flatText[currentIndex];
      const pressedChar = e.key;

      if (pressedChar === expectedChar) {
        // ── Correct ──
        if (!isMuted && clickSound) {
          playClickSound();
        }

        setCharStates((prev) => {
          const next = [...prev];
          next[currentIndex] = charErrorOnCurrent.current ? "corrected" : "correct";
          return next;
        });

        setCorrectCount((c) => c + 1);
        setCurrentCharError(false);
        charErrorOnCurrent.current = false;
        setCurrentIndex((i) => i + 1);
      } else {
        // ── Error ──
        if (!isMuted) {
          playErrorSound();
        }

        setErrorCount((c) => c + 1);
        setCurrentCharError(true);
        charErrorOnCurrent.current = true;

        // Track missed keys
        setMissedKeys((prev) => {
          const key = expectedChar === " " ? "space" : expectedChar.toLowerCase();
          return { ...prev, [key]: (prev[key] || 0) + 1 };
        });

        // Trigger shake on current word
        if (indexMap[currentIndex]) {
          const wordIdx = indexMap[currentIndex].wordIdx;
          setShakingWord(wordIdx);
          setTimeout(() => setShakingWord(-1), 300);
        }
      }
    },
    [
      showDashboard,
      finished,
      started,
      currentIndex,
      flatText,
      isMuted,
      clickSound,
      initWords,
      startTimer,
      indexMap,
    ]
  );

  // ── Render words ──
  const renderWords = () => {
    let flatIdx = 0;
    return words.map((word, wordIdx) => {
      const chars = [];
      for (let c = 0; c < word.length; c++) {
        const idx = flatIdx;
        const state = charStates[idx] || "untyped";
        const isCurrent = idx === currentIndex;
        let className = `char ${state}`;

        if (isCurrent && currentCharError) {
          className += " error";
        }

        chars.push(
          <span key={`${wordIdx}-${c}`} className={className} data-idx={idx}>
            {word[c]}
          </span>
        );
        flatIdx++;
      }

      // Space after word (except last)
      if (wordIdx < words.length - 1) {
        const spaceIdx = flatIdx;
        const spaceState = charStates[spaceIdx] || "untyped";
        let spaceClass = `char char-space ${spaceState}`;
        if (spaceIdx === currentIndex && currentCharError) {
          spaceClass += " error";
        }
        chars.push(
          <span
            key={`${wordIdx}-space`}
            className={spaceClass}
            data-idx={spaceIdx}
          >
            {" "}
          </span>
        );
        flatIdx++;
      }

      return (
        <span
          key={wordIdx}
          className={`word${shakingWord === wordIdx ? " word-shake" : ""}${
            currentCharError && indexMap[currentIndex]?.wordIdx === wordIdx
              ? " error-word"
              : ""
          }`}
        >
          {chars}
        </span>
      );
    });
  };

  // ── Results: sorted missed keys ──
  const sortedMissedKeys = useMemo(() => {
    return Object.entries(missedKeys)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [missedKeys]);

  const maxMissedCount = sortedMissedKeys.length > 0 ? sortedMissedKeys[0][1] : 1;

  // ── Remaining words count ──
  const remainingWordsCount = useMemo(() => {
    if (mode !== "words") return 0;
    return Math.max(0, words.length - wordsCompleted);
  }, [mode, words.length, wordsCompleted]);

  // ── Results screen ──
  if (finished) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header className="header fade-in">
          <div className="logo">
            <span className="logo-icon">⌨</span>
            <span className="logo-text">
              type<span>master</span>
            </span>
          </div>
          <div className="header-controls">
            <button
              className="icon-btn active"
              onClick={() => setShowDashboard(true)}
              title="Analytics & Weak Keys Dashboard"
            >
              <IconChart />
              <span className="tooltip">Dashboard</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="results-screen">
            <div className="results-header fade-in-up" style={{ animationDelay: "0.05s" }}>
              <h2>Test Complete</h2>
            </div>

            <div className="results-main fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="result-big">
                <div className="value">{currentWpm}</div>
                <div className="label">wpm</div>
              </div>
              <div className="result-big">
                <div className="value" style={{ color: accuracy >= 95 ? "var(--text-accent)" : "var(--text-error)" }}>
                  {accuracy}%
                </div>
                <div className="label">accuracy</div>
              </div>
            </div>

            <div className="results-details fade-in-up" style={{ animationDelay: "0.25s" }}>
              <div className="result-card">
                <div className="value">{rawWpm}</div>
                <div className="label">raw wpm</div>
              </div>
              <div className="result-card">
                <div className="value" style={{ color: "var(--text-error)" }}>{errorCount}</div>
                <div className="label">mistakes</div>
              </div>
              <div className="result-card">
                <div className="value">{Math.round(elapsed)}s</div>
                <div className="label">time</div>
              </div>
            </div>

            {sortedMissedKeys.length > 0 && (
              <div className="missed-keys-section fade-in-up" style={{ animationDelay: "0.35s" }}>
                <div className="missed-keys-title">Most Missed Keys This Session</div>
                <div className="missed-keys-grid">
                  {sortedMissedKeys.map(([key, count]) => (
                    <div key={key} className="missed-key">
                      <span className="key">{key === "space" ? "␣" : key}</span>
                      <div className="bar-bg">
                        <div
                          className="bar-fill"
                          style={{ width: `${(count / maxMissedCount) * 100}%` }}
                        />
                      </div>
                      <span className="count">×{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fade-in-up" style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                className="banner-cta-btn"
                onClick={() => {
                  setPracticeType("weak_keys");
                  initWords();
                }}
              >
                🎯 Practice Weak Keys
              </button>
              <button
                className="primary-btn"
                onClick={() => setShowDashboard(true)}
              >
                📊 View Analytics Dashboard
              </button>
            </div>

            <div className="restart-area fade-in-up" style={{ animationDelay: "0.45s" }}>
              <button className="restart-btn" onClick={initWords}>
                <IconRefresh /> Start New Test
              </button>
              <span className="restart-hint">or press Esc to restart</span>
            </div>
          </div>
        </div>

        <footer className="footer">
          TypeMaster — Train your accuracy
        </footer>

        {/* Global key listener for restart */}
        <ResultsKeyListener
          onRestart={initWords}
          showDashboard={showDashboard}
          onCloseDashboard={() => setShowDashboard(false)}
        />

        {/* Dashboard Modal */}
        {showDashboard && (
          <Dashboard
            stats={stats}
            onClose={() => setShowDashboard(false)}
            onStartWeakKeysPractice={() => {
              setPracticeType("weak_keys");
              initWords();
            }}
            onClearStats={() => {
              const fresh = clearAllStats();
              setStats(fresh);
            }}
          />
        )}
      </div>
    );
  }

  // ── Main typing screen ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⌨</span>
          <span className="logo-text">
            type<span>master</span>
          </span>
        </div>
        <div className="header-controls">
          <button
            className={`icon-btn${showDashboard ? " active" : ""}`}
            onClick={() => setShowDashboard(true)}
            title="Analytics & Weak Keys Dashboard"
          >
            <IconChart />
            <span className="tooltip">Dashboard</span>
          </button>
          <button
            className={`icon-btn${clickSound ? " active" : ""}`}
            onClick={() => setClickSound((v) => !v)}
            title="Toggle key click sound"
          >
            <IconClick />
            <span className="tooltip">Click Sound</span>
          </button>
          <button
            className={`icon-btn${isMuted ? "" : " active"}`}
            onClick={() => setIsMuted((v) => !v)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <IconMute /> : <IconVolume />}
            <span className="tooltip">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      </header>

      {/* Practice Type Selector (Random vs Weak Keys) */}
      <div className="practice-type-bar">
        <button
          className={`practice-tab${practiceType === "random" ? " active" : ""}`}
          onClick={() => {
            setPracticeType("random");
          }}
        >
          🎲 Random Practice
        </button>
        <button
          className={`practice-tab${practiceType === "weak_keys" ? " active" : ""}`}
          onClick={() => {
            setPracticeType("weak_keys");
          }}
        >
          <IconTarget /> Weak Keys Practice
          {weakKeysList.length > 0 && (
            <span className="practice-badge">
              {weakKeysList.slice(0, 3).map((k) => k.key.toUpperCase()).join(", ")}
            </span>
          )}
        </button>
      </div>

      {/* Weak Keys Active Indicator */}
      {practiceType === "weak_keys" && (
        <div className="weak-keys-active-notice fade-in">
          <span>🎯 Focusing on your mistyped keys:</span>
          {weakKeysList.length > 0 ? (
            weakKeysList.slice(0, 5).map(({ key, count }) => (
              <span key={key} className="weak-keys-chip">
                {key.toUpperCase()} ({count})
              </span>
            ))
          ) : (
            <span>tricky keys [Q, Z, X, P, B]</span>
          )}
        </div>
      )}

      {/* Mode bar */}
      <div className="mode-bar">
        <button
          className={`mode-btn-toggle${punctuation ? " active" : ""}`}
          onClick={() => setPunctuation((v) => !v)}
        >
          @ punctuation
        </button>
        <button
          className={`mode-btn-toggle${numbers ? " active" : ""}`}
          onClick={() => setNumbers((v) => !v)}
        >
          # numbers
        </button>

        <div className="mode-separator" />

        <button
          className={`mode-btn${mode === "time" ? " active" : ""}`}
          onClick={() => setMode("time")}
        >
          time
        </button>
        <button
          className={`mode-btn${mode === "words" ? " active" : ""}`}
          onClick={() => setMode("words")}
        >
          words
        </button>

        <div className="mode-separator" />

        {mode === "time"
          ? TIME_OPTIONS.map((t) => (
              <button
                key={t}
                className={`mode-btn${timeOption === t ? " active" : ""}`}
                onClick={() => setTimeOption(t)}
              >
                {t}
              </button>
            ))
          : WORD_OPTIONS.map((w) => (
              <button
                key={w}
                className={`mode-btn${wordOption === w ? " active" : ""}`}
                onClick={() => setWordOption(w)}
              >
                {w}
              </button>
            ))}
      </div>

      {/* Live HUD */}
      <div className={`live-hud${started ? " visible" : ""}`}>
        <div className="hud-item">
          <span className="hud-value">{currentWpm}</span>
          <span className="hud-label">wpm</span>
        </div>
        <div className="hud-item">
          <span className="hud-value">{accuracy}%</span>
          <span className="hud-label">accuracy</span>
        </div>
        <div className="hud-item">
          <span className="hud-value">
            {mode === "time"
              ? Math.ceil(remaining)
              : remainingWordsCount}
          </span>
          <span className="hud-label">
            {mode === "time" ? "seconds" : "words left"}
          </span>
        </div>
      </div>

      {/* Typing area */}
      <div className="typing-container">
        <div
          ref={typingRef}
          className={`typing-area${!focused && !finished && !showDashboard ? " blurred" : ""}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
        >
          <div className="focus-warning">Click here or press any key to focus</div>
          <div className="words-wrapper">
            <div className="words-inner" ref={wordsInnerRef}>
              <div 
                ref={caretRef} 
                className={`caret ${started ? "active" : "blink"}`}
              />
              {renderWords()}
            </div>
          </div>
        </div>

        {/* Restart hint */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button className="restart-btn" onClick={initWords} tabIndex={-1}>
            <IconRefresh />
          </button>
          <div className="restart-hint" style={{ marginTop: "8px" }}>
            esc — restart test
          </div>
        </div>
      </div>

      <footer className="footer">
        TypeMaster — Train your accuracy
      </footer>

      {/* Dashboard Modal */}
      {showDashboard && (
        <Dashboard
          stats={stats}
          onClose={() => setShowDashboard(false)}
          onStartWeakKeysPractice={() => {
            setPracticeType("weak_keys");
            initWords();
          }}
          onClearStats={() => {
            const fresh = clearAllStats();
            setStats(fresh);
          }}
        />
      )}
    </div>
  );
}

// ── Separate component to listen for restart keys on results screen ──
function ResultsKeyListener({ onRestart, showDashboard, onCloseDashboard }) {
  useEffect(() => {
    const handler = (e) => {
      if (showDashboard) {
        if (e.key === "Escape") {
          e.preventDefault();
          onCloseDashboard();
        }
        return;
      }
      if (e.key === "Escape" || e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRestart, showDashboard, onCloseDashboard]);
  return null;
}
