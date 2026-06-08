import React, { useState, useCallback, useRef, useEffect } from "react";
import { CaretLeft, CaretRight, Image, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import type { LotMedia } from "../types";

interface LotMediaCarouselProps {
  images: LotMedia[];
  lotId: string;
}

export default function LotMediaCarousel({ images, lotId }: LotMediaCarouselProps) {
  const { colors } = useTheme();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const len = images.length;
  const prev = useCallback(() => setActive((a) => (a > 0 ? a - 1 : len - 1)), [len]);
  const next = useCallback(() => setActive((a) => (a < len - 1 ? a + 1 : 0)), [len]);

  useEffect(() => {
    if (!loaded.has(active)) setLoaded((s) => new Set(s).add(active));
  }, [active, loaded]);

  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [lightbox]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") setLightbox(false);
  }, [prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (lightbox) return;
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || lightbox) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };
  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta > 60) prev();
    else if (touchDelta < -60) next();
    setTouchStart(null);
    setTouchDelta(0);
  };

  if (len === 0) return null;

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKey}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: colors.surfaceHover, userSelect: "none", outline: "none" }}
      >
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: touchDelta ? undefined : 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: touchDelta ? undefined : -60 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0, cursor: "pointer" }}
              onClick={() => setLightbox(true)}
            >
              {loaded.has(active) ? (
                <img
                  src={images[active].url}
                  alt={images[active].caption}
                  loading={active === 0 ? "eager" : "lazy"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
                  <Image size={40} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {len > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)", transition: "all 0.2s", zIndex: 2 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.65)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                aria-label="Image précédente"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)", transition: "all 0.2s", zIndex: 2 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.65)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                aria-label="Image suivante"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </>
          )}
        </div>

        {len > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setActive(i)}
                style={{ flexShrink: 0, width: 56, height: 42, borderRadius: 8, overflow: "hidden", border: i === active ? `2px solid ${colors.accent}` : "2px solid transparent", cursor: "pointer", padding: 0, background: colors.surfaceHover, transition: "border-color 0.2s, opacity 0.2s", opacity: i === active ? 1 : 0.55 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = i === active ? "1" : "0.55"; }}
              >
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
            onClick={() => setLightbox(false)}
            onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
            tabIndex={0}
          >
            <button onClick={() => setLightbox(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 10, transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              aria-label="Fermer"
            >
              <X size={22} />
            </button>

            {len > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 10, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}>
                  <CaretLeft size={24} weight="bold" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 10, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}>
                  <CaretRight size={24} weight="bold" />
                </button>
              </>
            )}

            <motion.img
              key={active}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              src={images[active].url}
              alt={images[active].caption}
              style={{ maxWidth: "92vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}
            />

            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center" }}>
              {images.map((img, i) => (
                <button key={img.id} onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  style={{ width: i === active ? 32 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: i === active ? colors.accent : "rgba(255,255,255,0.35)", transition: "all 0.3s", padding: 0 }} />
              ))}
            </div>

            <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>
              {active + 1} / {len} — {images[active].caption}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
