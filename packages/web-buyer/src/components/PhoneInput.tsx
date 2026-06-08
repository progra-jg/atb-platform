import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CaretDown, GlobeSimple, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import {
  detectOperator, formatPhoneInternational,
  listCountries, validatePhone, detectCountry,
} from "../utils/operator-detection";
import type { CountryInfo } from "../utils/operator-detection";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCountryChange?: (code: string) => void;
  error?: string;
  placeholder?: string;
  showOperator?: boolean;
  showFormat?: boolean;
  autoDetect?: boolean;
  disabled?: boolean;
}

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
}

const COUNTRY_OPTIONS: CountryOption[] = listCountries()
  .sort((a, b) => {
    if (a.code === "BJ") return -1;
    if (b.code === "BJ") return 1;
    return a.name.localeCompare(b.name);
  })
  .map(c => ({ code: c.code, name: c.name, dialCode: c.dialCode }));

function stripNonDigits(v: string): string { return v.replace(/\D/g, ""); }

function makePlaceholder(country: CountryInfo | undefined): string {
  if (!country) return "XX XX XX XX";
  const len = country.phoneLength;
  const parts: string[] = [];
  let pos = 0;
  while (pos < len) {
    const chunk = Math.min(2, len - pos);
    parts.push("X".repeat(chunk));
    pos += chunk;
  }
  return parts.join(" ");
}

export default function PhoneInput({
  value, onChange, countryCode: propCountry, onCountryChange,
  error, placeholder: placeholderProp, showOperator = true, showFormat = true,
  autoDetect = true, disabled = false,
}: PhoneInputProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const [localDigits, setLocalDigits] = useState(() => stripNonDigits(value));
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevPropValue = useRef(value);

  useEffect(() => {
    if (value !== prevPropValue.current) {
      prevPropValue.current = value;
      setLocalDigits(stripNonDigits(value));
    }
  }, [value]);

  const selected = useMemo<CountryOption>(
    () => COUNTRY_OPTIONS.find(c => c.code === (propCountry || "BJ")) || COUNTRY_OPTIONS[0],
    [propCountry],
  );

  const countryInfo = useMemo(
    () => listCountries().find(c => c.code === selected.code),
    [selected.code],
  );

  const filtered = useMemo(() => {
    if (!search) return COUNTRY_OPTIONS;
    const q = search.toLowerCase();
    return COUNTRY_OPTIONS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const digits = localDigits;
  const op = useMemo(
    () => showOperator && digits.length >= 2 ? detectOperator(digits, selected.code) : null,
    [digits, selected.code, showOperator],
  );
  const validation = useMemo(() => validatePhone(digits, selected.code), [digits, selected.code]);
  const formatted = useMemo(() => {
    if (!digits) return "";
    const info = listCountries().find(c => c.code === selected.code);
    if (!info) return digits;
    if (digits.length > info.phoneLength) return digits;
    return info.format(digits);
  }, [digits, selected.code]);

  const placeholder = placeholderProp ?? makePlaceholder(countryInfo);

  const select = useCallback((c: CountryOption) => {
    setOpen(false);
    setSearch("");
    onCountryChange?.(c.code);
    inputRef.current?.focus();
  }, [onCountryChange]);

  const handleChange = useCallback((raw: string) => {
    const d = stripNonDigits(raw);
    setLocalDigits(d);
    onChange(d);
    setAnimKey(k => k + 1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, filtered.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)); break;
      case "Enter": e.preventDefault(); if (filtered[focusedIdx]) select(filtered[focusedIdx]); break;
      case "Escape": e.preventDefault(); setOpen(false); inputRef.current?.focus(); break;
    }
  }, [open, filtered, focusedIdx, select]);

  useEffect(() => {
    if (!open) return;
    setFocusedIdx(0);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && focusedIdx >= 0) {
      const item = listRef.current.children[focusedIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIdx, open]);

  useEffect(() => {
    if (!open || !filtered.length) return;
    setFocusedIdx(0);
  }, [search]);

  useEffect(() => {
    if (!autoDetect || !digits || propCountry) return;
    const detected = detectCountry(digits);
    if (detected && detected.code !== selected.code) {
      onCountryChange?.(detected.code);
    }
  }, [digits, autoDetect, propCountry, selected.code, onCountryChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const shouldShowFormat = showFormat && validation.valid && digits.length >= 4;

  return (
    <div>
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`Code pays: +${selected.dialCode} ${selected.name}`}
              style={{
                height: "100%", padding: "0 6px 0 10px", borderRadius: 8,
                border: `1.5px solid ${error ? colors.error : colors.borderLight}`,
                background: colors.inputBg, color: colors.text, cursor: disabled ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600,
                whiteSpace: "nowrap", transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                fontFamily: "'SF Mono', 'Fira Code', monospace", opacity: disabled ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = colors.accent; }}
              onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = error ? colors.error : colors.borderLight; }}
            >
              <GlobeSimple size={13} weight="bold" />
              <span>+{selected.dialCode}</span>
              <CaretDown size={9} weight="bold" style={{
                opacity: 0.5, transition: "transform 0.2s ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }} />
            </button>
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
              width: 240, maxHeight: 280, overflow: "hidden", borderRadius: 12,
              background: `color-mix(in srgb, ${colors.surface}, #000 15%)`,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${colors.accent}10`,
              backdropFilter: "blur(16px)",
              opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
              transform: `translateY(${open ? 0 : -4}px) scale(${open ? 1 : 0.97})`,
              transition: "opacity 0.15s ease, transform 0.15s ease",
              transformOrigin: "top left",
            }}>
              <div style={{ padding: "6px 8px", borderBottom: `1px solid ${colors.borderLight}` }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 8px", borderRadius: 6,
                  border: `1px solid ${colors.borderLight}`, background: colors.inputBg,
                }}>
                  <MagnifyingGlass size={12} opacity={0.5} />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    style={{
                      flex: 1, border: "none", outline: "none", background: "transparent",
                      fontSize: 11, color: colors.text, fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
              <div
                ref={listRef}
                role="listbox"
                onKeyDown={handleKeyDown}
                style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}
              >
                {filtered.map((c, i) => (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={c.code === selected.code}
                    onClick={() => select(c)}
                    onMouseEnter={() => setFocusedIdx(i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", border: "none", cursor: "pointer",
                      fontSize: 12, textAlign: "left", fontFamily: "inherit",
                      background: i === focusedIdx
                        ? `color-mix(in srgb, ${colors.accent}, transparent 85%)`
                        : "transparent",
                      color: colors.text,
                      transition: "background 0.1s ease",
                    }}
                  >
                    <span style={{ flex: 1, fontWeight: c.code === selected.code ? 700 : 400 }}>
                      {c.name}
                    </span>
                    <span style={{ opacity: 0.5, fontSize: 11, fontFamily: "'SF Mono','Fira Code',monospace" }}>
                      +{c.dialCode}
                    </span>
                    {c.code === selected.code && (
                      <Check size={12} color={colors.accent} weight="bold" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: "16px 12px", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>
                    Aucun pays trouvé
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", flex: 1 }}>
            <input
              ref={inputRef}
              value={formatted}
              onChange={e => handleChange(e.target.value)}
              placeholder={placeholder}
              inputMode="tel"
              autoComplete="tel-national"
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={error ? "phone-error" : undefined}
              style={{
                width: "100%", padding: "12px 12px",
                paddingRight: op ? 52 : 12,
                borderRadius: 8,
                border: `1.5px solid ${error ? colors.error : colors.borderLight}`,
                background: colors.inputBg, fontSize: 14, color: colors.text,
                outline: "none", boxSizing: "border-box",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                letterSpacing: "0.3px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: error
                  ? `0 0 0 3px ${colors.error}15`
                  : digits.length >= 2
                    ? `0 0 0 3px ${colors.accent}08`
                    : "none",
                opacity: disabled ? 0.5 : 1,
                animation: error ? `shakeX 0.4s ease ${animKey}` : "none",
              }}
              onFocus={e => {
                if (!error) e.target.style.boxShadow = `0 0 0 3px ${colors.accent}12`;
              }}
              onBlur={e => {
                e.target.style.boxShadow = error
                  ? `0 0 0 3px ${colors.error}15`
                  : digits.length >= 2
                    ? `0 0 0 3px ${colors.accent}08`
                    : "none";
              }}
            />
            {op && (
              <div style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                display: "flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 4, background: op.bgColor,
                fontSize: 10, fontWeight: 700, color: op.color, pointerEvents: "none",
                lineHeight: "18px", animation: "fadeSlideUp 0.2s ease",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: op.color, flexShrink: 0 }} />
                {op.name}
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div id="phone-error" style={{
          fontSize: 10, color: colors.error, marginTop: 4, display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: colors.error, flexShrink: 0 }} />
          {error}
        </div>
      )}
      {shouldShowFormat && (
        <div style={{
          fontSize: 10, color: colors.textSecondary, marginTop: 4,
          display: "flex", alignItems: "center", gap: 4,
          animation: "fadeSlideUp 0.2s ease",
        }}>
          <GlobeSimple size={10} />
          {formatPhoneInternational(value, selected.code)}
        </div>
      )}
    </div>
  );
}
