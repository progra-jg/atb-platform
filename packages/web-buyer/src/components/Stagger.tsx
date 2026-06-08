import React, { ReactNode, useRef, useEffect, useState } from "react";

interface StaggerProps {
  children: ReactNode[];
  stagger?: number;
  baseDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

function StaggerItem({ children, delay, direction, className }: {
  children: ReactNode; delay: number; direction: string; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const offsets: Record<string, string> = {
    up: "translateY(20px)", down: "translateY(-20px)",
    left: "translateX(20px)", right: "translateX(-20px)", none: "translateY(0)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) translateX(0)" : offsets[direction] || offsets.up,
        transition: `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      {children}
    </div>
  );
}

export default function Stagger({
  children, stagger = 80, baseDelay = 0, direction = "up", className,
}: StaggerProps) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <StaggerItem key={i} delay={baseDelay + i * stagger} direction={direction} className={className}>
          {child}
        </StaggerItem>
      ))}
    </>
  );
}

export function StaggerGrid({ children, columns = 3, gap = 14, stagger = 60, baseDelay = 50, direction = "up" }: {
  children: ReactNode[]; columns?: number | string; gap?: number; stagger?: number; baseDelay?: number; direction?: "up" | "down" | "left" | "right" | "none";
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns, gap }}>
      <Stagger stagger={stagger} baseDelay={baseDelay} direction={direction}>
        {children}
      </Stagger>
    </div>
  );
}
