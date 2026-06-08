import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import QASampleCard from "../components/QASampleCard";
import QAAnalysisResult from "../components/QAAnalysisResult";
import QACertificateCard from "../components/QACertificateCard";
import QAPhotoGallery from "../components/QAPhotoGallery";
import {
  listSamples, submitAnalysis, getCertificate, listCertificates, listPhotos,
} from "../services/qualityAssurance";
import type { QASample, QAAnalysis, QACertificate, QAPhoto } from "../types/qualityAssurance";
import { SealCheck, FloppyDisk, ArrowLeft, Plus } from "@phosphor-icons/react";

type TabKey = "samples" | "certificates" | "photos";

export default function QAPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("samples");
  const [samples, setSamples] = useState<QASample[]>([]);
  const [certificates, setCertificates] = useState<QACertificate[]>([]);
  const [photos, setPhotos] = useState<QAPhoto[]>([]);
  const [selectedSample, setSelectedSample] = useState<QASample | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisForm, setAnalysisForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, c, p] = await Promise.all([
          listSamples(), listCertificates(), listPhotos(),
        ]);
        if (mounted) { setSamples(s); setCertificates(c); setPhotos(p); }
      } catch {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (selectedSample) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
        <motion.button
          onClick={() => setSelectedSample(null)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft size={14} />
          {t("common.back")}
        </motion.button>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-800">{selectedSample.crop}</h2>
            <span className="text-[10px] text-gray-400 font-mono">{selectedSample.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div><span className="text-gray-400">{t("qa.sample.producer")}:</span> {selectedSample.producerName}</div>
            <div><span className="text-gray-400">{t("qa.sample.region")}:</span> {selectedSample.region}</div>
            <div><span className="text-gray-400">{t("qa.sample.volume")}:</span> {selectedSample.volumeKg.toLocaleString("fr-FR")} kg</div>
            <div><span className="text-gray-400">{t("qa.sample.sampleSize")}:</span> {selectedSample.sampleSizeKg} kg</div>
          </div>
          {selectedSample.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">"{selectedSample.notes}"</p>
          )}
        </div>

        {selectedSample.status === "requested" && (
          <div className="flex gap-2 mb-4">
            {["collected", "in_analysis", "completed"].map((s) => (
              <motion.button
                key={s}
                className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-200 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {t(`qa.status.${s}`)}
              </motion.button>
            ))}
          </div>
        )}

        {!analysisForm && selectedSample.status === "completed" && (
          <motion.button
            onClick={() => setAnalysisForm(true)}
            className="w-full py-2.5 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors mb-4"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {t("qa.sample.submitAnalysis")}
          </motion.button>
        )}

        {analysisForm && (
          <AnalysisForm
            sampleId={selectedSample.id}
            lotId={selectedSample.lotId}
            onSubmit={async (data) => {
              const result = await submitAnalysis({ ...data, sampleId: selectedSample.id, lotId: selectedSample.lotId });
              setAnalysisForm(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <SealCheck size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{t("qa.pageTitle")}</h1>
            <p style={{ fontSize: 12, color: colors.textMuted }}>{t("qa.pageDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {(["samples", "certificates", "photos"] as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === key ? "bg-violet-100 text-violet-800" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t(`qa.tab.${key}`)}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "samples" && (
          <motion.div key="samples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : samples.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-50 flex items-center justify-center">
                  <FloppyDisk size={24} className="text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t("qa.empty.title")}</p>
                <p className="text-xs text-gray-400">{t("qa.empty.desc")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {samples.map((s) => (
                    <QASampleCard key={s.id} sample={s} onClick={() => setSelectedSample(s)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === "certificates" && (
          <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {certificates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xs text-gray-400">{t("qa.empty.certificates")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((c) => (
                  <QACertificateCard key={c.id} certificate={c} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "photos" && (
          <motion.div key="photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QAPhotoGallery photos={photos} loading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalysisForm({ sampleId, lotId, onSubmit }: {
  sampleId: string; lotId: string;
  onSubmit: (data: {
    sampleId: string; lotId: string; analyst: string;
    moistureContent: number; impurityRate: number; defectRate: number;
    grade: string; notes: string; result: "pass" | "fail";
  }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [moisture, setMoisture] = useState("");
  const [impurity, setImpurity] = useState("");
  const [defect, setDefect] = useState("");
  const [grade, setGrade] = useState("Grade A");
  const [result, setResult] = useState<"pass" | "fail">("pass");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        sampleId, lotId, analyst: "Analyste",
        moistureContent: Number(moisture) || 0,
        impurityRate: Number(impurity) || 0,
        defectRate: Number(defect) || 0,
        grade, notes: "",
        result,
      });
    } catch {
      /* noop */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-violet-100"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("qa.analysis.form.title")}</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: t("qa.analysis.moisture"), value: moisture, set: setMoisture, suffix: "%" },
          { label: t("qa.analysis.impurity"), value: impurity, set: setImpurity, suffix: "%" },
          { label: t("qa.analysis.defect"), value: defect, set: setDefect, suffix: "%" },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-[9px] text-gray-400 uppercase block mb-0.5">{field.label}</label>
            <input
              value={field.value}
              onChange={(e) => field.set(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="Grade A">Grade A</option>
          <option value="Grade B">Grade B</option>
          <option value="Grade C">Grade C</option>
          <option value="Premium">Premium</option>
          <option value="Standard">Standard</option>
        </select>
        <div className="flex gap-1">
          <button
            onClick={() => setResult("pass")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              result === "pass" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {t("qa.analysis.form.pass")}
          </button>
          <button
            onClick={() => setResult("fail")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              result === "fail" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {t("qa.analysis.form.fail")}
          </button>
        </div>
      </div>
      <motion.button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {submitting ? "..." : t("qa.analysis.form.submit")}
      </motion.button>
    </motion.div>
  );
}
