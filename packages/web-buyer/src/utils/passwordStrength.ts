const COMMON_PASSWORDS = new Set([
  "password", "12345678", "qwerty123", "admin123", "letmein", "welcome",
  "monkey123", "dragon123", "master123", "123456789", "1234567890",
  "passer123", "motdepasse", "azerty123", "mot2passe", "soleil123",
]);

const SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "0123456789",
  "9876543210",
  "qwertyuiop", "poiuytrewq",
  "asdfghjkl", "lkjhgfdsa",
  "zxcvbnm", "mnbvcxz",
  "azertyuiop", "poiuytreza",
  "qsdfghjklm", "mlkjhgfdsq",
  "wxcvbn", "nbvcxw",
];

const KEYBOARD_ADJACENCY: Record<string, string> = {
  q: "wa", w: "qeas", e: "wrsd", r: "etdf", t: "ryfg", y: "tugh",
  u: "yihj", i: "uojk", o: "ipkl", p: "olm", a: "zqsw", s: "azedx",
  d: "sercf", f: "drtvg", g: "ftyhb", h: "gyujn", j: "huikm", k: "jiol",
  l: "kop", z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn",
  n: "bhjm", m: "njk", "0": "9-", "1": "2q", "2": "13w", "3": "24e",
  "4": "35r", "5": "46t", "6": "57y", "7": "68u", "8": "79i", "9": "80o",
};

function charSetSize(char: string): number {
  if (/[a-z]/.test(char)) return 26;
  if (/[A-Z]/.test(char)) return 26;
  if (/\d/.test(char)) return 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(char)) return 33;
  return 100;
}

function estimateEntropy(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  return pool > 0 ? Math.log2(pool) * password.length : 0;
}

function detectRepeats(password: string): number {
  let penalty = 0;
  let run = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      run++;
    } else {
      if (run >= 3) penalty += run * 2;
      run = 1;
    }
  }
  if (run >= 3) penalty += run * 2;
  return penalty;
}

function detectSequences(password: string): number {
  const lower = password.toLowerCase();
  let penalty = 0;
  for (const seq of SEQUENCES) {
    for (let len = 3; len <= Math.min(6, seq.length); len++) {
      for (let i = 0; i <= seq.length - len; i++) {
        const sub = seq.slice(i, i + len);
        if (lower.includes(sub)) penalty += len * 3;
      }
    }
  }
  return penalty;
}

function detectKeyboardRoll(password: string): number {
  const lower = password.toLowerCase();
  let penalty = 0;
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower[i], b = lower[i + 1], c = lower[i + 2];
    const adj = KEYBOARD_ADJACENCY[a];
    if (adj) {
      if (adj.includes(b) && (KEYBOARD_ADJACENCY[b] || "").includes(c)) {
        penalty += 5;
      }
    }
  }
  return penalty;
}

function estimateCrackTime(entropy: number): { seconds: number; label: string } {
  const guessesPerSecond = 1e10; // 10 billion guesses/sec (modern GPU cluster)
  const seconds = Math.pow(2, entropy) / guessesPerSecond;
  const intervals: [number, string][] = [
    [1, "instantané"],
    [60, "quelques secondes"],
    [3600, "quelques minutes"],
    [86400, "quelques heures"],
    [2592000, "quelques jours"],
    [31536000, "quelques mois"],
    [315360000, "plusieurs années"],
    [3153600000, "des siècles"],
  ];
  for (const [limit, label] of intervals) {
    if (seconds < limit) return { seconds, label };
  }
  return { seconds, label: "plusieurs siècles" };
}

export interface PasswordAnalysis {
  score: number; // 0-100
  entropy: number;
  strength: 0 | 1 | 2 | 3 | 4;
  strengthLabel: string;
  crackTimeLabel: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    special: boolean;
    noCommon: boolean;
    noSequence: boolean;
    noRepeat: boolean;
  };
  feedback: string[];
}

const STRENGTH_LABELS = [
  "Très faible",
  "Faible",
  "Moyen",
  "Fort",
  "Très fort",
];

export function analyzePassword(password: string): PasswordAnalysis {
  if (!password) {
    return {
      score: 0, entropy: 0, strength: 0, strengthLabel: STRENGTH_LABELS[0],
      crackTimeLabel: "—", checks: {
        length: false, uppercase: false, lowercase: false, digit: false,
        special: false, noCommon: true, noSequence: true, noRepeat: true,
      }, feedback: [],
    };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    noCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    noSequence: detectSequences(password) === 0,
    noRepeat: detectRepeats(password) < 6,
  };

  const entropy = estimateEntropy(password);
  const repeatPenalty = detectRepeats(password);
  const seqPenalty = detectSequences(password);
  const kbPenalty = detectKeyboardRoll(password);

  const baseScore = Math.min(entropy * 6, 100);
  const totalPenalty = Math.min(repeatPenalty + seqPenalty + kbPenalty, baseScore * 0.6);
  const rawScore = Math.max(0, Math.round(baseScore - totalPenalty));

  const bonusChars = [checks.uppercase, checks.lowercase, checks.digit, checks.special].filter(Boolean).length;
  const diversityBonus = bonusChars >= 3 ? 5 : bonusChars >= 2 ? 2 : 0;
  const lengthBonus = password.length >= 12 ? 5 : password.length >= 10 ? 2 : 0;

  let score = Math.min(100, rawScore + diversityBonus + lengthBonus);

  let strength: 0 | 1 | 2 | 3 | 4 = 0;
  if (score >= 80) strength = 4;
  else if (score >= 60) strength = 3;
  else if (score >= 40) strength = 2;
  else if (score >= 20) strength = 1;

  const { label: crackTimeLabel } = estimateCrackTime(entropy);

  const feedback: string[] = [];
  if (checks.length && password.length < 12) feedback.push("Ajoutez encore quelques caractères pour renforcer");
  if (!checks.uppercase) feedback.push("Ajoutez une majuscule");
  if (!checks.lowercase) feedback.push("Ajoutez une minuscule");
  if (!checks.digit) feedback.push("Ajoutez un chiffre");
  if (!checks.special) feedback.push("Ajoutez un caractère spécial");
  if (!checks.noCommon) feedback.push("Ce mot de passe est trop commun");
  if (!checks.noSequence) feedback.push("Évitez les suites de caractères");
  if (repeatPenalty >= 6) feedback.push("Trop de répétitions");
  if (kbPenalty > 0) feedback.push("Évitez les suites clavier");

  return {
    score, entropy: Math.round(entropy * 10) / 10,
    strength, strengthLabel: STRENGTH_LABELS[strength],
    crackTimeLabel, checks, feedback,
  };
}
