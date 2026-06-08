import React from "react";

export default function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes shimmerSkeleton {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes scrollFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .page-fade { animation: fadeSlideUp 0.4s ease both; }
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      ::selection { background: rgba(13, 122, 74, 0.15); color: inherit; }
      [data-theme="dark"] ::selection { background: rgba(52, 211, 153, 0.2); }

      /* RTL readiness: logical properties via CSS custom props */
      [dir="rtl"] { --start: right; --end: left; }
      [dir="ltr"] { --start: left; --end: right; }
      [dir="rtl"] .rtl-mirror { transform: scaleX(-1); }
      [dir="rtl"] .rtl-row { flex-direction: row-reverse; }

      /* Scrollbar RTL-aware */
      [dir="rtl"] .hide-scrollbar { direction: rtl; }

      *:focus-visible {
        outline: 2px solid #0d7a4a;
        outline-offset: 2px;
      }

      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #ddd7cd; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #c5bdb0; }
      [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #2a2f2c; }
      [data-theme="dark"] ::-webkit-scrollbar-thumb:hover { background: #3a403c; }

      /* Animations respecting reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }

      @keyframes sentinelRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes nodePulse {
        0%, 100% {
          box-shadow: 0 0 4px rgba(10,110,74,0), 0 0 12px rgba(10,110,74,0);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 8px rgba(10,110,74,0.6), 0 0 24px rgba(10,110,74,0.3);
          transform: scale(1.25);
        }
      }

      @keyframes chainLink {
        0%, 100% { opacity: 0; transform: scaleY(0); }
        25%      { opacity: 0.06; transform: scaleY(1); }
        75%      { opacity: 0.06; transform: scaleY(1); }
        100%     { opacity: 0; transform: scaleY(0); }
      }

      @keyframes valueRise {
        0% {
          transform: translateY(calc(100vh + 40px)) translateX(0) scale(0.6);
          opacity: 0;
        }
        15% { opacity: 0.35; }
        85% { opacity: 0.35; }
        100% {
          transform: translateY(-120px) translateX(var(--drift, 30px)) scale(1);
          opacity: 0;
        }
      }

      @keyframes valueGlow {
        0%, 100% { filter: blur(2px) brightness(0.8); }
        50%      { filter: blur(5px) brightness(1.4); }
      }
    `}</style>
  );
}
