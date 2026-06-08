import { useTheme } from "../context/ThemeContext";

interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ size = 36, showText = false, color }) => {
  const { colors } = useTheme();
  const green = color || colors.accent;
  const textColor = color || "#fff";
  const subColor = color ? `${color}99` : "rgba(255,255,255,0.45)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="16" stroke={green} strokeWidth="1.2" />
        <circle cx="18" cy="12" r="4" fill={green} />
        <circle cx="18" cy="12" r="1.5" fill="white" />
        <circle cx="11" cy="24" r="3" fill={`${green}40`} />
        <circle cx="25" cy="24" r="3" fill={`${green}40`} />
        <circle cx="11" cy="24" r="1.2" fill={green} />
        <circle cx="25" cy="24" r="1.2" fill={green} />
        <line x1="15.5" y1="15.5" x2="12.5" y2="21.5" stroke={green} strokeWidth="1" strokeLinecap="round" />
        <line x1="20.5" y1="15.5" x2="23.5" y2="21.5" stroke={green} strokeWidth="1" strokeLinecap="round" />
      </svg>
      {showText && (
        <div>
          <div style={{ color: textColor, fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.25 }}>
            ATB AgriTrace
          </div>
          <div style={{ color: subColor, fontSize: 9, fontWeight: 500, letterSpacing: "0.7px" }}>
            BÉNIN
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
