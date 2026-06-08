import React, { type ElementType, type ReactNode, type CSSProperties } from "react";

type AsProp<T extends ElementType> = { as?: T };

type BoxOwnProps<T extends ElementType = "div"> = {
  children?: ReactNode;
  as?: T;
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
  pr?: number | string;
  pb?: number | string;
  pl?: number | string;
  m?: number | string;
  mx?: number | string;
  my?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
  w?: number | string;
  h?: number | string;
  minW?: number | string;
  maxW?: number | string;
  bg?: string;
  color?: string;
  radius?: string | number;
  shadow?: string;
  opacity?: number;
  cursor?: CSSProperties["cursor"];
  pos?: CSSProperties["position"];
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  z?: number;
  overflow?: CSSProperties["overflow"];
  transform?: string;
  transition?: string;
  animation?: string;
  textAlign?: CSSProperties["textAlign"];
  fontSize?: number | string;
  fontWeight?: CSSProperties["fontWeight"];
  fontFamily?: string;
  lineHeight?: number | string;
  letterSpacing?: string;
  whiteSpace?: CSSProperties["whiteSpace"];
  userSelect?: CSSProperties["userSelect"];
  pointerEvents?: CSSProperties["pointerEvents"];
  border?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  borderRadius?: string | number;
  boxShadow?: string;
  gridTemplateColumns?: string;
  gridGap?: number | string;
  sx?: CSSProperties;
  style?: CSSProperties;
  id?: string;
  className?: string;
  role?: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  ref?: React.Ref<HTMLDivElement>;
  key?: React.Key;
};

type BoxProps<T extends ElementType = "div"> = BoxOwnProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof BoxOwnProps<T> | "as">;

const px = (v: number | string | undefined): string | number | undefined =>
  v === undefined ? undefined : typeof v === "number" ? `${v}px` : v;

export function Box<T extends ElementType = "div">({ as: Tag, children, display, flex, flexDirection, alignItems, justifyContent, flexWrap, gap,
  p, px: pxVal, py, pt, pr, pb, pl,
  m, mx, my, mt, mr, mb, ml,
  w, h, minW, maxW, bg, color,
  radius, shadow, opacity, cursor,
  pos, top, right, bottom, left, z,
  overflow, transform, transition, animation,
  textAlign, fontSize, fontWeight, fontFamily, lineHeight, letterSpacing, whiteSpace,
  userSelect, pointerEvents,
  border, borderTop, borderBottom, borderLeft, borderRight, borderRadius,
  boxShadow, gridTemplateColumns, gridGap,
  sx, style, ref, ...rest }: BoxProps<T>) {
  const Comp = Tag || "div";
  const resolved: CSSProperties = {
    display, flex, flexDirection, alignItems, justifyContent, flexWrap,
    gap: px(gap),
    padding: px(p), paddingLeft: px(pl ?? pxVal), paddingRight: px(pr ?? pxVal),
    paddingTop: px(pt ?? py), paddingBottom: px(pb ?? py),
    margin: px(m), marginLeft: px(ml ?? mx), marginRight: px(mr ?? mx),
    marginTop: px(mt ?? my), marginBottom: px(mb ?? my),
    width: px(w), height: px(h), minWidth: px(minW), maxWidth: px(maxW),
    background: bg, color,
    border, borderTop, borderBottom, borderLeft, borderRight,
    borderRadius: px(borderRadius ?? radius),
    boxShadow: boxShadow ?? shadow, opacity, cursor,
    position: pos, top: px(top), right: px(right), bottom: px(bottom), left: px(left),
    zIndex: z, overflow, transform, transition, animation,
    textAlign, fontSize: px(fontSize), fontWeight, fontFamily, lineHeight, letterSpacing, whiteSpace,
    userSelect, pointerEvents,
    gridTemplateColumns, gridGap: px(gridGap),
    boxSizing: "border-box",
    ...sx, ...style,
  };
  return <Comp ref={ref} style={resolved} {...(rest as any)}>{children}</Comp>;
}
