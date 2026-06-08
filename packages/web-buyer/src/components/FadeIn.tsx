import React, { ReactNode, useRef, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

const FadeIn: React.FC<Props> = ({ children, delay = 0, direction = "up", className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const offsets = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 },
    none: { y: 0, x: 0 },
  };

  const o = offsets[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) translateX(0)" : `translateY(${o.y}px) translateX(${o.x}px)`,
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {children}
    </div>
  );
};

export function FadeInStagger({ children, baseDelay = 80 }: { children: ReactNode[]; baseDelay?: number }) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <FadeIn key={i} delay={i * baseDelay}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}

export default FadeIn;
