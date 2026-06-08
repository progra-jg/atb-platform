export interface MobileOperator {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  color: string;
  bgColor: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  phoneLength: number;
  format: (digits: string) => string;
}

interface OperatorEntry {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  prefixes: string[];
}

interface CountryEntry {
  code: string;
  name: string;
  dialCode: string;
  phoneLength: number;
  format: (digits: string) => string;
  operators: OperatorEntry[];
}

class PrefixTrieNode {
  children = new Map<string, PrefixTrieNode>();
  op: MobileOperator | null = null;
}

class PrefixTrie {
  private root = new PrefixTrieNode();

  insert(prefix: string, operator: MobileOperator): void {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) node.children.set(ch, new PrefixTrieNode());
      node = node.children.get(ch)!;
    }
    node.op = operator;
  }

  findLongestPrefix(digits: string): MobileOperator | null {
    let node = this.root;
    let best: MobileOperator | null = null;
    for (const ch of digits) {
      const next = node.children.get(ch);
      if (!next) break;
      node = next;
      if (node.op) best = node.op;
    }
    return best;
  }
}

const COUNTRIES: CountryEntry[] = [
  {
    code: "BJ", name: "Bénin", dialCode: "229", phoneLength: 10,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8)}`,
    operators: [
      { id: "mtn_bj", name: "MTN", color: "#ffcc00", bgColor: "#fff9e6",
        prefixes: ["40","41","42","43","46","50","51","52","53","54","56","60","61","62","66","90","91","95","96"] },
      { id: "moov_bj", name: "Moov", color: "#e30613", bgColor: "#fde8ea",
        prefixes: ["45","47","49","55","57","65","67","69","94","97","98","99"] },
      { id: "celtiis_bj", name: "Celtiis", color: "#00a651", bgColor: "#e6f7ee",
        prefixes: ["44","48","58","59","64","68","92","93"] },
    ],
  },
  {
    code: "CI", name: "Côte d'Ivoire", dialCode: "225", phoneLength: 10,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8)}`,
    operators: [
      { id: "mtn_ci", name: "MTN", color: "#ffcc00", bgColor: "#fff9e6",
        prefixes: range("01", "09") },
      { id: "orange_ci", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: range("040", "079") },
      { id: "moov_ci", name: "Moov", color: "#e30613", bgColor: "#fde8ea",
        prefixes: [...range("010", "039"), ...range("080", "089")] },
      { id: "wave_ci", name: "Wave", color: "#00bf6f", bgColor: "#e6faf1",
        prefixes: range("090", "099") },
    ],
  },
  {
    code: "TG", name: "Togo", dialCode: "228", phoneLength: 8,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`,
    operators: [
      { id: "togocom_tg", name: "Togocom", color: "#1a73e8", bgColor: "#e8f0fe",
        prefixes: range("90", "99") },
      { id: "moov_tg", name: "Moov", color: "#e30613", bgColor: "#fde8ea",
        prefixes: range("70", "79") },
    ],
  },
  {
    code: "BF", name: "Burkina Faso", dialCode: "226", phoneLength: 8,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`,
    operators: [
      { id: "orange_bf", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: range("60", "69") },
      { id: "moov_bf", name: "Moov", color: "#e30613", bgColor: "#fde8ea",
        prefixes: range("70", "79") },
      { id: "telmob_bf", name: "Telmob", color: "#00a651", bgColor: "#e6f7ee",
        prefixes: range("50", "59") },
    ],
  },
  {
    code: "NE", name: "Niger", dialCode: "227", phoneLength: 8,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`,
    operators: [
      { id: "orange_ne", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: range("90", "99") },
      { id: "moov_ne", name: "Moov", color: "#e30613", bgColor: "#fde8ea",
        prefixes: range("80", "89") },
    ],
  },
  {
    code: "SN", name: "Sénégal", dialCode: "221", phoneLength: 9,
    format: (d) => `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`,
    operators: [
      { id: "orange_sn", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: ["70","75","76","77","78"] },
      { id: "free_sn", name: "Free", color: "#d32f2f", bgColor: "#fde8ea",
        prefixes: ["76","77"] },
    ],
  },
  {
    code: "ML", name: "Mali", dialCode: "223", phoneLength: 8,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`,
    operators: [
      { id: "orange_ml", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: range("70", "79") },
      { id: "malitel_ml", name: "Malitel", color: "#1a73e8", bgColor: "#e8f0fe",
        prefixes: range("60", "69") },
    ],
  },
  {
    code: "GN", name: "Guinée", dialCode: "224", phoneLength: 9,
    format: (d) => `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`,
    operators: [
      { id: "orange_gn", name: "Orange", color: "#ff7900", bgColor: "#fff3e6",
        prefixes: range("60", "69") },
      { id: "mtn_gn", name: "MTN", color: "#ffcc00", bgColor: "#fff9e6",
        prefixes: ["62","63","64","65","66"] },
    ],
  },
  {
    code: "GH", name: "Ghana", dialCode: "233", phoneLength: 10,
    format: (d) => `0${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`,
    operators: [
      { id: "mtn_gh", name: "MTN", color: "#ffcc00", bgColor: "#fff9e6",
        prefixes: range("23", "29") },
      { id: "vodafone_gh", name: "Vodafone", color: "#e30613", bgColor: "#fde8ea",
        prefixes: ["20"] },
    ],
  },
  {
    code: "NG", name: "Nigeria", dialCode: "234", phoneLength: 10,
    format: (d) => `0${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`,
    operators: [
      { id: "mtn_ng", name: "MTN", color: "#ffcc00", bgColor: "#fff9e6",
        prefixes: ["70","80","81","90","91"] },
      { id: "glo_ng", name: "Glo", color: "#00a651", bgColor: "#e6f7ee",
        prefixes: ["70","80","81"] },
      { id: "airtel_ng", name: "Airtel", color: "#e30613", bgColor: "#fde8ea",
        prefixes: ["70","80","90"] },
      { id: "mobile_ng", name: "9mobile", color: "#1a73e8", bgColor: "#e8f0fe",
        prefixes: ["90","91"] },
    ],
  },
];

function range(from: string, to: string): string[] {
  const start = parseInt(from, 10);
  const end = parseInt(to, 10);
  const pad = from.length;
  return Array.from({ length: end - start + 1 }, (_, i) =>
    String(start + i).padStart(pad, "0"));
}

const countryByDialCode = new Map<string, CountryInfo>();
const countryByCode = new Map<string, CountryInfo>();
const trie = new PrefixTrie();

for (const c of COUNTRIES) {
  const info: CountryInfo = {
    code: c.code, name: c.name, dialCode: c.dialCode,
    phoneLength: c.phoneLength, format: c.format,
  };
  countryByDialCode.set(c.dialCode, info);
  countryByCode.set(c.code, info);

  for (const op of c.operators) {
    const operator: MobileOperator = {
      id: op.id, name: op.name, countryCode: c.code,
      countryName: c.name, color: op.color, bgColor: op.bgColor,
    };
    for (const prefix of op.prefixes) {
      trie.insert(prefix, operator);
      if (c.code === "BJ") trie.insert(`01${prefix}`, operator);
    }
  }
}

function stripPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  for (const [code, digitsLen] of [["229", 3], ["225", 3], ["228", 3], ["226", 3], ["227", 3], ["221", 3], ["223", 3], ["224", 3], ["233", 3], ["234", 3]] as const) {
    if (digits.startsWith(code)) return digits.slice(digitsLen);
  }
  return digits;
}

export function detectOperator(phone: string, countryHint?: string): MobileOperator | null {
  const digits = stripPhone(phone);
  if (digits.length < 4) return null;

  const op = trie.findLongestPrefix(digits);
  if (op && countryHint && op.countryCode !== countryHint) return null;
  if (op) return op;

  if (countryHint) {
    const country = countryByCode.get(countryHint);
    return country
      ? { id: "unknown", name: country.name, countryCode: countryHint, countryName: country.name, color: "#888", bgColor: "#f0f0f0" }
      : null;
  }

  return null;
}

export function detectCountry(phone: string): CountryInfo | null {
  const digits = phone.replace(/\D/g, "");
  for (const [code, info] of countryByDialCode) {
    if (digits.startsWith(code)) return info;
  }
  return null;
}

export function validatePhone(phone: string, countryCode?: string): { valid: boolean; clean: string; error?: string } {
  const digits = stripPhone(phone);
  if (!digits) return { valid: false, clean: "", error: "Numéro requis" };

  let country: CountryInfo | null = null;
  if (countryCode) country = countryByCode.get(countryCode) ?? null;
  if (!country) country = detectCountry(phone);

  if (country && digits.length !== country.phoneLength) {
    return {
      valid: false, clean: digits,
      error: `Format invalide — attendu ${country.phoneLength} chiffres (+${country.dialCode} X)`,
    };
  }

  if (!country && (digits.length < 4 || digits.length > 15)) {
    return { valid: false, clean: digits, error: "Numéro invalide" };
  }

  return { valid: true, clean: digits };
}

export function formatPhoneLocal(phone: string, countryCode?: string): string {
  const digits = stripPhone(phone);
  const country = countryCode ? countryByCode.get(countryCode) : detectCountry(phone);
  if (!country) return digits;
  return country.format(digits);
}

export function formatE164(phone: string, countryCode?: string): string {
  const digits = stripPhone(phone);
  const country = countryCode ? countryByCode.get(countryCode) : detectCountry(phone);
  return country ? `+${country.dialCode}${digits}` : `+${digits}`;
}

export function formatPhoneInternational(phone: string, countryCode?: string): string {
  return `${formatE164(phone, countryCode)} (${formatPhoneLocal(phone, countryCode)})`;
}

export function getCountryInfo(code: string): CountryInfo | undefined {
  return countryByCode.get(code);
}

export function listCountries(): CountryInfo[] {
  return [...countryByCode.values()];
}

export function parseDialCode(input: string): { dialCode: string; rest: string } | null {
  const digits = input.replace(/\D/g, "");
  for (const [code] of countryByDialCode) {
    if (digits.startsWith(code)) return { dialCode: code, rest: digits.slice(code.length) };
  }
  return null;
}
