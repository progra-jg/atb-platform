import React, { useState, ReactElement } from "react";

interface Props {
  icon: ReactElement;
  onClick?: () => void;
  tooltip?: string;
  size?: number;
  color?: string;
  bg?: string;
  hoverBg?: string;
  disabled?: boolean;
}

const IconButton: React.FC<Props> = ({
  icon, onClick, tooltip, size: btnSize = 36, color,
  bg = "transparent", hoverBg, disabled = false,
}) => {
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const show = (e: React.MouseEvent | React.FocusEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTipPos({ x: r.left + r.width / 2, y: r.top - 8 });
    setShowTip(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={show}
        onMouseLeave={() => setShowTip(false)}
        onFocus={show}
        onBlur={() => setShowTip(false)}
        style={{
          width: btnSize, height: btnSize, borderRadius: 10,
          border: "none", background: bg, color: color || "inherit",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0,
          transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}
        onMouseOver={(e) => { if (!disabled) { e.currentTarget.style.background = hoverBg || bg; e.currentTarget.style.transform = "scale(1.05)"; }}}
        onMouseOut={(e) => { if (!disabled) { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "scale(1)"; }}}
      >
        {icon}
      </button>
      {tooltip && showTip && (
        <div style={{
          position: "fixed", left: tipPos.x, top: tipPos.y, zIndex: 9999,
          transform: "translate(-50%, -100%)",
          background: "#1a1a2e", color: "white", fontSize: 11, fontWeight: 500,
          padding: "5px 10px", borderRadius: 6, whiteSpace: "nowrap",
          pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}>
          {tooltip}
          <div style={{
            position: "absolute", left: "50%", bottom: -4, transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent", borderTop: "5px solid #1a1a2e",
          }} />
        </div>
      )}
    </>
  );
};

export default IconButton;
