import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../../utils/format";

export default function AnimatedNumber({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  const done = useRef(false);
  const { i18n } = useTranslation();
  useEffect(() => {
    if (!isInView) return;
    if (done.current) { setValue(to); return; }
    done.current = true;
    const controls = animate(0, to, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, to]);
  return <span ref={ref} aria-live="polite" aria-atomic="true">{formatNumber(value)}{suffix}</span>;
}
