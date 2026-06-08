import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Camera, X, CheckCircle, Keyboard, Flashlight } from "@phosphor-icons/react";
import jsQR from "jsqr";
import { useTheme } from "../context/ThemeContext";

type ScanState = "idle" | "scanning" | "success" | "error";
type CamPermission = "prompt" | "granted" | "denied" | "unavailable";

const LOT_ID_REGEX = /[A-Za-z]{3}[-][\dA-Za-z-]+/;

export default function ScanPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const [state, setState] = useState<ScanState>("idle");
  const [camPermission, setCamPermission] = useState<CamPermission>("prompt");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [result, setResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamPermission("unavailable");
      return;
    }
    if ("permissions" in navigator && typeof navigator.permissions.query === "function") {
      navigator.permissions.query({ name: "camera" as PermissionName }).then((p) => {
        setCamPermission(p.state as CamPermission);
        p.addEventListener("change", () => setCamPermission(p.state as CamPermission));
      }).catch(() => {});
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const [track] = streamRef.current.getVideoTracks();
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] as any });
      setTorchOn(!torchOn);
    } catch { /* torch not supported */ }
  };

  const startScanning = async () => {
    setState("scanning");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      setTorchSupported("torch" in (track.getCapabilities?.() ?? {}));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err: any) {
      setState("error");
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setErrorMsg(t("scan.cameraDenied"));
      } else if (err?.name === "NotFoundError") {
        setErrorMsg(t("scan.noCamera"));
      } else {
        setErrorMsg(t("scan.cameraError"));
      }
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (code) {
      setResult(code.data);
      setState("success");
      try { navigator.vibrate?.(100); } catch { /* no haptics */ }
      stopCamera();
      setTimeout(() => {
        const match = code.data.match(/\/lots\/([^\/?#]+)/);
        if (match) navigate(`/lots/${match[1]}`);
        else setState("idle");
      }, 1200);
      return;
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  const handleReset = useCallback(() => {
    stopCamera();
    setResult("");
    setErrorMsg("");
    setState("idle");
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualValue.trim();
    if (!val) return;
    const clean = val.startsWith("/lots/") ? val.replace("/lots/", "") : val;
    navigate(`/lots/${clean}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.accent}14`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.accent }}>
          <QrCode size={18} weight="fill" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.3px" }}>{t("scan.title")}</h1>
      </div>

      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <div style={{ width: 112, height: 112, borderRadius: 28, background: `${colors.accent}0c`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: colors.accent }}>
                  <Camera size={48} weight="thin" />
                </div>
              </motion.div>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 28, lineHeight: 1.7, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                {t("scan.instructions")}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={startScanning}
                disabled={camPermission === "denied" || camPermission === "unavailable"}
                style={{
                  padding: "15px 36px", borderRadius: 14, border: "none",
                  background: camPermission === "denied" ? colors.borderLight : colors.accent,
                  color: camPermission === "denied" ? colors.textMuted : "#fff",
                  fontSize: 15, fontWeight: 600, cursor: camPermission === "denied" ? "not-allowed" : "pointer",
                  fontFamily: "inherit", boxShadow: camPermission === "denied" ? "none" : `0 4px 20px ${colors.accent}35`,
                  transition: "all 0.2s",
                }}
              >
                {camPermission === "denied" ? t("scan.cameraDenied") : t("scan.start")}
              </motion.button>
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => setManualEntry(!manualEntry)}
                  style={{ background: "none", border: "none", color: colors.accent, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: "6px 12px", borderRadius: 8 }}
                >
                  <Keyboard size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  {t("scan.manualEntry")}
                </button>
              </div>
              {manualEntry && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleManualSubmit} style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", gap: 8, maxWidth: 340, margin: "0 auto" }}>
                    <input
                      autoFocus
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      placeholder="ATB-2403-001"
                      style={{
                        flex: 1, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${colors.border}`,
                        background: colors.inputBg ?? colors.surface, color: colors.text, fontSize: 14,
                        fontFamily: "inherit", outline: "none", letterSpacing: "0.5px",
                      }}
                    />
                    <button type="submit" style={{
                      padding: "11px 18px", borderRadius: 10, border: "none", background: colors.accent,
                      color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                    GO
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        )}

        {state === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "#000", aspectRatio: "1/1", maxWidth: 400, margin: "0 auto", boxShadow: "0 8px 48px rgba(0,0,0,0.35)" }}>
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0 }}>
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <div style={{ position: "absolute", top: "20%", left: "15%", width: "70%", height: "60%", pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: `3px solid ${colors.accent}`, borderLeft: `3px solid ${colors.accent}`, borderTopLeftRadius: 8 }} />
                    <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: `3px solid ${colors.accent}`, borderRight: `3px solid ${colors.accent}`, borderTopRightRadius: 8 }} />
                    <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: `3px solid ${colors.accent}`, borderLeft: `3px solid ${colors.accent}`, borderBottomLeftRadius: 8 }} />
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: `3px solid ${colors.accent}`, borderRight: `3px solid ${colors.accent}`, borderBottomRightRadius: 8 }} />
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`, boxShadow: `0 0 12px ${colors.accent}80` }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                {torchSupported && (
                  <button onClick={toggleTorch} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", color: torchOn ? colors.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <Flashlight size={18} weight={torchOn ? "fill" : "regular"} />
                  </button>
                )}
                <button onClick={handleReset} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, letterSpacing: "0.3px", background: "rgba(0,0,0,0.4)", padding: "6px 16px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                {t("scan.scanning")}
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </motion.div>
        )}

        {state === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }} style={{ textAlign: "center", padding: "48px 0" }}>
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: `${colors.success}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: colors.success, boxShadow: `0 0 40px ${colors.success}25` }}>
                <CheckCircle size={44} weight="fill" />
              </div>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ fontSize: 19, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{t("scan.found")}</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ fontSize: 12, color: colors.textMuted, wordBreak: "break-all", maxWidth: 360, margin: "0 auto" }}>{result}</motion.p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} style={{ textAlign: "center", padding: "40px 0" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: `${colors.error}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: colors.error }}>
                <X size={36} weight="bold" />
              </div>
            </motion.div>
            <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 1.6, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleReset}
                style={{ padding: "12px 24px", borderRadius: 12, border: `1.5px solid ${colors.accent}`, background: "transparent", color: colors.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {t("common.retry")}
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setManualEntry(true)}
                style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: colors.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Keyboard size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {t("scan.manualEntry")}
              </motion.button>
            </div>
            {manualEntry && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleManualSubmit} style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 8, maxWidth: 340, margin: "0 auto" }}>
                  <input
                    autoFocus
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="ATB-2403-001"
                    style={{
                      flex: 1, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${colors.border}`,
                      background: colors.inputBg ?? colors.surface, color: colors.text, fontSize: 14,
                      fontFamily: "inherit", outline: "none", letterSpacing: "0.5px",
                    }}
                  />
                  <button type="submit" style={{
                    padding: "11px 18px", borderRadius: 10, border: "none", background: colors.accent,
                    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    GO
                  </button>
                </div>
              </motion.form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
