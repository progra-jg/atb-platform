import { type Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: d * 0.1 },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (d = 0) => ({
    opacity: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: d * 0.1 },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (d = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: d * 0.1 },
  }),
};

export const slideUpBounce: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (d = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: d * 0.1 },
  }),
};

export const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

export const cardHover = {
  rest: { scale: 1, y: 0, boxShadow: "var(--shadow-sm)" },
  hover: {
    scale: 1.02, y: -2,
    boxShadow: "var(--shadow-lg)",
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const springTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

export const shimmerSkeleton = {
  background: "var(--skeleton-shimmer)",
  backgroundSize: "200% 100%",
  animation: "shimmerSkeleton 1.5s ease-in-out infinite",
};
