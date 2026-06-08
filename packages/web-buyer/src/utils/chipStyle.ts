export const chipStyle = (bgOpacity: number, isSelected: boolean, accentColor: string) => ({
  flex: 1,
  padding: "12px 0",
  borderRadius: 12,
  border: isSelected ? `1px solid ${accentColor}` : "1px solid transparent",
  background: isSelected ? `rgba(0,0,0,0.02)` : `rgba(255,255,255,${bgOpacity})`,
  color: isSelected ? accentColor : "inherit",
  fontSize: 13,
  fontWeight: isSelected ? 600 : 500,
  cursor: "pointer",
  transition: "all 0.2s"
});