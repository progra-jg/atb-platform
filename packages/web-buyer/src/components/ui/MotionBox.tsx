import { type ReactNode, type CSSProperties, forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

type BoxVariant = "default" | "glass" | "elevated" | "bordered" | "card";

interface MotionBoxOwnProps {
  children?: ReactNode;
  variant?: BoxVariant;
  display?: CSSProperties["display"];
  flex?: CSSProperties["flex"];
  flexDirection?: CSSProperties["flexDirection"];
  alignItems?: CSSProperties["alignItems"];
  justifyContent?: CSSProperties["justifyContent"];
  flexWrap?: CSSProperties["flexWrap"];
  gap?: number | string;
  p?: number | string;
  px?: number | string;
  py?: number | string;
  pt?: number | string;
  pb?: number | string;
  pl?: number | string;
  pr?: number | string;
  m?: number | string;
  mx?: number | string;
  my?: number | string;
  mt?: number | string;
  mb?: number | string;
  ml?: number | string;
  mr?: number | string;
  w?: number | string;
  h?: number | string;
  minW?: number | string;
  maxW?: number | string;
  bg?: string;
  color?: string;
  radius?: string | number;
  pos?: CSSProperties["position"];
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  z?: number;
  overflow?: CSSProperties["overflow"];
  textAlign?: CSSProperties["textAlign"];
  fontSize?: number | string;
  fontWeight?: CSSProperties["fontWeight"];
  border?: string;
  borderBottom?: string;
  boxShadow?: string;
  gridTemplateColumns?: string;
  gridGap?: number | string;
  sx?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

type MotionBoxProps = MotionBoxOwnProps & Omit<HTMLMotionProps<"div">, keyof MotionBoxOwnProps>;

const VARIANT_STYLES: Record<BoxVariant, CSSProperties> = {
  default: {},
  glass: {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    backdropFilter: "var(--glass-blur)",
  },
  elevated: {
    background: "var(--color-surface-elevated)",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--color-border-light)",
  },
  bordered: {
    border: "1px solid var(--color-border)",
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
  },
};

function toPx(v: number | string | undefined): string | undefined {
  if (v === undefined) return;
  return typeof v === "number" ? `${v}px` : v;
}

export const MotionBox = forwardRef<HTMLDivElement, MotionBoxProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    const {
      display, flex, flexDirection, alignItems, justifyContent, flexWrap, gap,
      p, px: pxVal, py, pt, pb, pl, pr,
      m, mx, my, mt, mb, ml, mr,
      w, h, minW, maxW, bg, color,
      radius, pos, top, right, bottom, left, z,
      overflow, textAlign, fontSize, fontWeight,
      border, borderBottom, boxShadow,
      gridTemplateColumns, gridGap, sx, ...rest
    } = props;

    const style: CSSProperties = {
      ...VARIANT_STYLES[variant],
      display, flex, flexDirection, alignItems, justifyContent, flexWrap,
      gap: toPx(gap),
      padding: toPx(p), paddingLeft: toPx(pl ?? pxVal), paddingRight: toPx(pr ?? pxVal),
      paddingTop: toPx(pt ?? py), paddingBottom: toPx(pb ?? py),
      margin: toPx(m), marginLeft: toPx(ml ?? mx), marginRight: toPx(mr ?? mx),
      marginTop: toPx(mt ?? my), marginBottom: toPx(mb ?? my),
      width: toPx(w), height: toPx(h), minWidth: toPx(minW), maxWidth: toPx(maxW),
      background: bg, color,
      borderRadius: toPx(radius),
      position: pos, top: toPx(top), right: toPx(right), bottom: toPx(bottom), left: toPx(left),
      zIndex: z, overflow, textAlign, fontSize: toPx(fontSize), fontWeight,
      border, borderBottom, boxShadow,
      gridTemplateColumns, gridGap: toPx(gridGap),
      boxSizing: "border-box",
      ...sx,
    };

    return (
      <motion.div
        ref={ref}
        className={clsx(className)}
        style={style}
        {...(rest as any)}
      >
        {children}
      </motion.div>
    );
  }
);

MotionBox.displayName = "MotionBox";
