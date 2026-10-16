// ── Common English words pool (200 words) ──
const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "great", "between", "need", "large", "under", "never", "each", "right", "hand",
  "high", "place", "around", "house", "small", "number", "again", "point", "city",
  "home", "long", "world", "very", "still", "should", "last", "school", "might",
  "where", "start", "keep", "every", "three", "before", "while", "found", "part",
  "life", "name", "being", "head", "once", "down", "side", "been", "left", "page",
  "open", "seem", "next", "walk", "stop", "grow", "began", "hard", "change", "must",
  "story", "move", "kind", "help", "show", "line", "turn", "play", "close", "ask",
  "own", "same", "tell", "does", "set", "end", "did", "try", "off", "always",
  "run", "near", "real", "leave", "read", "group", "both", "often", "stand", "lost",
  "plan", "face", "watch", "write", "young", "free", "water", "room", "fire", "door"
];

// Extended words for more variety and vocabulary range
const EXTENDED_WORDS = [
  "ability", "achieve", "across", "actually", "almost", "already", "although",
  "answer", "anything", "appear", "available", "beautiful", "become", "believe",
  "better", "brought", "building", "business", "called", "certain", "children",
  "community", "company", "complete", "consider", "control", "country", "course",
  "current", "daughter", "decision", "describe", "design", "develop", "different",
  "difficult", "during", "economic", "education", "effort", "election", "enough",
  "especially", "evening", "evidence", "exactly", "example", "experience",
  "explain", "family", "feeling", "finally", "finger", "foreign", "forget",
  "forward", "friend", "future", "garden", "general", "government", "ground",
  "growth", "happen", "health", "herself", "himself", "history", "hundred",
  "husband", "imagine", "important", "include", "increase", "indeed", "industry",
  "information", "instead", "interest", "involve", "kitchen", "language",
  "leader", "letter", "likely", "listen", "little", "local", "machine",
  "manager", "market", "matter", "meeting", "member", "memory", "mention",
  "message", "method", "middle", "million", "minute", "modern", "moment",
  "morning", "mother", "movement", "natural", "network", "nothing", "notice",
  "office", "operate", "opportunity", "order", "outside", "parent", "pattern",
  "perhaps", "period", "person", "picture", "player", "please", "political",
  "popular", "position", "possible", "present", "problem", "produce", "product",
  "program", "project", "provide", "public", "purpose", "quality", "question",
  "quickly", "rather", "reason", "receive", "record", "reduce", "region",
  "relate", "remain", "remember", "report", "require", "research", "result",
  "return", "season", "second", "section", "senior", "series", "serious",
  "service", "several", "simple", "single", "sister", "situation", "social",
  "society", "soldier", "special", "standard", "station", "strong", "student",
  "subject", "success", "suggest", "support", "system", "teacher", "technology",
  "though", "through", "together", "tonight", "toward", "traditional", "travel",
  "trouble", "understand", "usually", "value", "various", "visit", "voice",
  "whether", "window", "within", "without", "wonder", "worker"
];

// Targeted supplementary words rich in tricky, less frequent letters (q, z, x, j, v, b, p, f, k)
const TRICKY_LETTER_WORDS = [
  "quiz", "quick", "quiet", "quote", "quarter", "queen", "quest", "queue", "equal",
  "liquid", "frequent", "unique", "require", "acquire", "sequence", "adequacy",
  "zero", "zone", "prize", "size", "maze", "freeze", "breeze", "blaze", "crazy",
  "citizen", "horizon", "organize", "realize", "analyze", "puzzle", "drizzle", "zoom",
  "exact", "extra", "expect", "expert", "explain", "extend", "explore", "example",
  "complex", "galaxy", "matrix", "prefix", "suffix", "relax", "oxygen", "toxic",
  "judge", "major", "project", "subject", "object", "injury", "justice", "journey",
  "adjust", "jacket", "joint", "junior", "jungle", "reject", "inject", "enjoy",
  "vivid", "value", "voice", "various", "level", "every", "heavy", "event",
  "brave", "prove", "solve", "serve", "active", "native", "visual", "travel",
  "blank", "block", "brick", "bright", "brown", "build", "burst", "cable",
  "climb", "cabin", "habit", "hobby", "public", "symbol", "object", "absorb",
  "paper", "happy", "party", "piece", "point", "power", "press", "price",
  "proud", "prove", "rapid", "shape", "sleep", "space", "spend", "split"
];

const FULL_POOL = [...COMMON_WORDS, ...EXTENDED_WORDS, ...TRICKY_LETTER_WORDS];

const PUNCTUATION_MARKS = [".", ",", ";", ":", "!", "?", "'", '"'];
const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Generate a list of words for the typing test.
 * Supports:
 * - "random": completely random distribution
 * - "weak_keys": heavily biases towards words containing the user's missed letters
 * 
 * @param {number} count - Number of words to generate
 * @param {boolean} includePunctuation - Whether to add punctuation
 * @param {boolean} includeNumbers - Whether to intersperse numbers
 * @param {string[]} targetLetters - Array of characters to target (e.g. ['e', 'r', 'b'])
 * @returns {string[]} Array of words
 */
export function generateWords(
  count,
  includePunctuation = false,
  includeNumbers = false,
  targetLetters = []
) {
  // Normalize target letters to lowercase
  const cleanTargets = (targetLetters || [])
    .map((k) => k.toLowerCase())
    .filter((k) => k.length === 1 && /[a-z0-9]/.test(k));

  let pool = FULL_POOL;
  let targetedPool = [];

  if (cleanTargets.length > 0) {
    // Find all words containing one or more of the target letters
    targetedPool = FULL_POOL.filter((word) => {
      const lower = word.toLowerCase();
      return cleanTargets.some((char) => lower.includes(char));
    });

    // If matching words found, sort them so words containing multiple target letters come first
    if (targetedPool.length > 0) {
      targetedPool.sort((a, b) => {
        const countA = cleanTargets.reduce((acc, c) => acc + (a.includes(c) ? 1 : 0), 0);
        const countB = cleanTargets.reduce((acc, c) => acc + (b.includes(c) ? 1 : 0), 0);
        return countB - countA;
      });
    }
  }

  const words = [];

  for (let i = 0; i < count; i++) {
    let word = "";

    // In weak keys mode: ~80% of words are drawn from the targeted pool, ~20% from common pool for flow
    if (targetedPool.length > 0 && (Math.random() < 0.85 || i % 4 !== 0)) {
      word = targetedPool[Math.floor(Math.random() * targetedPool.length)];
    } else {
      word = pool[Math.floor(Math.random() * pool.length)];
    }

    if (includePunctuation && Math.random() < 0.15 && i > 0) {
      const punct = PUNCTUATION_MARKS[Math.floor(Math.random() * PUNCTUATION_MARKS.length)];
      word = word + punct;
    }

    if (includeNumbers && Math.random() < 0.1) {
      const num = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      const num2 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      word = Math.random() < 0.5 ? num + num2 : word + num;
    }

    words.push(word);
  }

  return words;
}
