import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { QAPhoto } from "../types/qualityAssurance";
import { Image, X, Camera } from "@phosphor-icons/react";

interface Props {
  photos: QAPhoto[];
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  field: "from-green-400 to-emerald-500",
  product: "from-amber-400 to-orange-500",
  packaging: "from-blue-400 to-indigo-500",
  label: "from-violet-400 to-purple-500",
};

export default function QAPhotoGallery({ photos, loading }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
          <Camera size={20} className="text-gray-300" />
        </div>
        <p className="text-xs text-gray-400">{t("qa.photos.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            layoutId={photo.id}
            onClick={() => setSelected(photo.id)}
            className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
            whileHover={{ scale: 1.03 }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${TYPE_COLORS[photo.type] ?? "from-gray-400 to-gray-500"} flex items-center justify-center`}>
              <Image size={28} className="text-white/60" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-[8px] text-white truncate">{photo.caption}</p>
            </div>
            <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/40 rounded text-[7px] text-white uppercase">
              {t(`qa.photos.type.${photo.type}`)}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (() => {
          const photo = photos.find((p) => p.id === selected);
          if (!photo) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
            >
              <motion.div
                layoutId={selected}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="max-w-md w-full bg-white rounded-2xl overflow-hidden"
              >
                <div className={`w-full h-48 bg-gradient-to-br ${TYPE_COLORS[photo.type] ?? "from-gray-400 to-gray-500"} flex items-center justify-center relative`}>
                  <Image size={48} className="text-white/30" />
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center"
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase ${
                      photo.type === "field" ? "bg-green-100 text-green-700" :
                      photo.type === "product" ? "bg-amber-100 text-amber-700" :
                      photo.type === "packaging" ? "bg-blue-100 text-blue-700" :
                      "bg-violet-100 text-violet-700"
                    }`}>
                      {t(`qa.photos.type.${photo.type}`)}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(photo.takenAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-sm text-gray-800">{photo.caption}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{t("qa.photos.by")} {photo.takenBy}</p>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
