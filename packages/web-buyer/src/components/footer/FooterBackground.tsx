import { useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

interface Orb {
  x: number; y: number; r: number;
  dx: number; dy: number;
  color: string;
  alpha: number;
  pulse: number; pulseSpeed: number;
}

const ORB_COLORS_DARK = ["52,211,153", "10,110,74", "6,78,52", "52,211,153"];
const ORB_COLORS_LIGHT = ["10,110,74", "5,105,85", "6,78,52", "16,185,129"];

export default function FooterBackground() {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = isDark ? ORB_COLORS_DARK : ORB_COLORS_LIGHT;
    const dpr = window.devicePixelRatio || 1;
    const w = () => canvas!.width = canvas!.offsetWidth * dpr;
    const h = () => canvas!.height = canvas!.offsetHeight * dpr;
    w(); h();

    orbsRef.current = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight * 0.6,
      r: 80 + Math.random() * 140,
      dx: (0.08 + Math.random() * 0.12) * (i % 2 ? 1 : -1),
      dy: (0.05 + Math.random() * 0.08) * (i % 2 ? -1 : 1),
      color: colors[i % colors.length],
      alpha: 0.015 + Math.random() * 0.025,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.003 + Math.random() * 0.005,
    }));

    let animId: number;
    const step = () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const orbs = orbsRef.current;
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;

      for (const o of orbs) {
        o.x += o.dx;
        o.y += o.dy;
        o.pulse += o.pulseSpeed;
        if (o.x < -o.r || o.x > cw + o.r) o.dx *= -1;
        if (o.y < -o.r || o.y > ch + o.r) o.dy *= -1;
        const pulseAlpha = o.alpha * (0.7 + 0.3 * Math.sin(o.pulse));
        const grad = ctx!.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `rgba(${o.color},${pulseAlpha})`);
        grad.addColorStop(0.5, `rgba(${o.color},${pulseAlpha * 0.4})`);
        grad.addColorStop(1, `rgba(${o.color},0)`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);

    const ro = new ResizeObserver(() => { w(); h(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0, zIndex: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
