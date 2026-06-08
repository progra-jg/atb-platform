import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { EudrAssessment, ComplianceStatus } from "../types/eudrFunnel";
import { EUDR_REQUIREMENTS } from "../types/eudrFunnel";

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: "#22c55e",
  partial: "#eab308",
  non_compliant: "#ef4444",
  pending_verification: "#8b5cf6",
  expired: "#6b7280",
};

interface Props {
  assessment: EudrAssessment;
  onVerify?: (requirementId: string, satisfied: boolean, notes: string) => void;
}

export default function EudrComplianceScore({ assessment, onVerify }: Props) {
  const { t } = useTranslation();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const controls = animate(count, assessment.score, { duration: 1.5, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setCurrent(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [assessment.score, count, rounded]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - assessment.score / 100);
  const statusColor = STATUS_COLORS[assessment.status];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              stroke={statusColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: statusColor }}>{current}</span>
            <span className="text-[10px] text-gray-500">/ 100</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span className="font-semibold text-gray-800">
              {t(`eudrFunnel.status.${assessment.status}`)}
            </span>
          </div>
          <p className="text-sm text-gray-500">{assessment.crop} — {assessment.region}</p>
          {assessment.validUntil && (
            <p className="text-xs text-gray-400 mt-1">
              {t("eudrFunnel.validUntil")}{" "}
              {new Date(assessment.validUntil).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {EUDR_REQUIREMENTS.map((req) => {
          const result = assessment.requirements.find((r) => r.requirementId === req.id);
          if (!result) return null;
          return (
            <motion.div
              key={req.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border ${
                result.satisfied
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  result.satisfied ? "bg-green-500" : "bg-red-400"
                }`}>
                  {result.satisfied ? "✓" : "✗"}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t(req.labelKey)}</p>
                  <p className="text-xs text-gray-500">{t(req.descKey)}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium">+{req.weight}%</span>
            </motion.div>
          );
        })}
      </div>

      {onVerify && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">{t("eudrFunnel.verify")}</p>
          <div className="flex gap-2">
            {EUDR_REQUIREMENTS.map((req) => {
              const result = assessment.requirements.find((r) => r.requirementId === req.id);
              if (!result) return null;
              return (
                <button
                  key={req.id}
                  onClick={() => onVerify(req.id, !result.satisfied, "")}
                  className={`px-2 py-1 text-xs rounded border ${
                    result.satisfied
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-green-300 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {result.satisfied ? t("eudrFunnel.markFail") : t("eudrFunnel.markPass")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
