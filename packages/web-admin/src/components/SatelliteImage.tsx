import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Slider, Chip, IconButton, Tooltip } from "@mui/material";
import { MapTrifold, MagnifyingGlassPlus, MagnifyingGlassMinus } from "@phosphor-icons/react";

interface SatelliteImageProps {
  beforeUrl?: string;
  afterUrl?: string;
  dateBefore?: string;
  dateAfter?: string;
}

interface Patch { x: number; y: number; w: number; h: number; }

function generateTerrain(w: number, h: number, deforested: boolean): Patch[] {
  const patches: Patch[] = [];
  for (let i = 0; i < 50; i++) {
    patches.push({
      x: Math.random() * w, y: Math.random() * h,
      w: 20 + Math.random() * 80, h: 20 + Math.random() * 60,
    });
  }
  return patches;
}

function drawTerrain(ctx: CanvasRenderingContext2D, w: number, h: number, deforested: boolean, scroll: number, scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(0, -scroll);

  ctx.fillStyle = deforested ? "#3e2723" : "#1b5e20";
  ctx.fillRect(0, 0, w, h);

  const gridSize = 40;
  for (let y = 0; y < h; y += gridSize) {
    for (let x = 0; x < w; x += gridSize) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const val = seed - Math.floor(seed);
      const isForest = val > 0.45;
      if (isForest) {
        ctx.fillStyle = deforested ? `hsl(${20 + val * 30}, ${40 + val * 30}%, ${15 + val * 20}%)` : `hsl(${100 + val * 40}, ${50 + val * 30}%, ${25 + val * 20}%)`;
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }

  if (deforested) {
    for (let i = 0; i < 12; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      ctx.fillStyle = `hsl(${25 + Math.random() * 15}, ${50 + Math.random() * 30}%, ${30 + Math.random() * 20}%)`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 20 + Math.random() * 40, 15 + Math.random() * 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const rivers = ["#1565c0", "#1976d2", "#0d47a1"];
    for (let r = 0; r < 3; r++) {
      ctx.strokeStyle = rivers[r];
      ctx.lineWidth = 3 + Math.random() * 4;
      ctx.beginPath();
      let rx = Math.random() * w, ry = 0;
      ctx.moveTo(rx, ry);
      for (let s = 0; s < 8; s++) {
        rx += (Math.random() - 0.5) * 80;
        ry += h / 8;
        ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

const SatelliteImage: React.FC<SatelliteImageProps> = ({
  beforeUrl, afterUrl,
  dateBefore = "2023-01", dateAfter = "2024-01",
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState(0);
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasImages = beforeUrl && afterUrl;

  useEffect(() => {
    if (hasImages) return;
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 350;

    const beforeCanvas = beforeRef.current;
    const afterCanvas = afterRef.current;
    if (beforeCanvas) {
      beforeCanvas.width = w; beforeCanvas.height = h;
      const ctx = beforeCanvas.getContext("2d");
      if (ctx) drawTerrain(ctx, w, h, false, scroll, zoom);
    }
    if (afterCanvas) {
      afterCanvas.width = w; afterCanvas.height = h;
      const ctx = afterCanvas.getContext("2d");
      if (ctx) drawTerrain(ctx, w, h, true, scroll, zoom);
    }
  }, [zoom, scroll, hasImages]);

  const handleWheel = (e: React.WheelEvent) => {
    setScroll((s) => Math.max(0, s + e.deltaY * 0.5));
  };

  return (
    <Box>
      <Box
        ref={containerRef}
        onWheel={handleWheel}
        sx={{
          position: "relative", height: 350,
          bgcolor: "#0a0a1a", borderRadius: 3, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)", cursor: "grab",
        }}
      >
        {hasImages ? (
          <>
            <img src={beforeUrl} alt="Avant" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            <Box sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${100 - sliderPos}%`, overflow: "hidden" }}>
              <img src={afterUrl} alt="Après" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", right: 0, top: 0 }} />
            </Box>
            <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, bgcolor: "white", boxShadow: "0 0 8px rgba(0,0,0,0.5)", zIndex: 2 }} />
          </>
        ) : (
          <>
            <canvas ref={afterRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            <Box sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${100 - sliderPos}%`, overflow: "hidden" }}>
              <canvas ref={beforeRef} style={{ width: "100%", height: "100%" }} />
            </Box>
            <Box sx={{
              position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 2,
              bgcolor: "white", boxShadow: "0 0 8px rgba(0,0,0,0.5)", zIndex: 2,
            }} />
            <Box sx={{ position: "absolute", bottom: 44, right: 8, display: "flex", gap: 0.5, zIndex: 3 }}>
              <Tooltip title="Zoom avant">
                <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }} onClick={() => setZoom((z) => Math.min(4, z + 0.3))}>
                  <MagnifyingGlassPlus size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom arrière">
                <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }} onClick={() => setZoom((z) => Math.max(0.5, z - 0.3))}>
                  <MagnifyingGlassMinus size={16} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 3 }}>
              <Chip label={`Zoom: ${zoom.toFixed(1)}x`} size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white" }} />
            </Box>
          </>
        )}
        {/* overlay labels */}
        <Box sx={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 1, zIndex: 2 }}>
          <Chip label={`Avant: ${dateBefore}`} size="small" sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "white" }} />
          <Chip label={`Après: ${dateAfter}`} size="small" sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "white" }} />
        </Box>
        {hasImages && (
          <Box sx={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 0.5, zIndex: 3 }}>
            <Tooltip title="Zoom avant">
              <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }} onClick={() => setZoom((z) => Math.min(4, z + 0.3))}>
                <MagnifyingGlassPlus size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom arrière">
              <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }} onClick={() => setZoom((z) => Math.max(0.5, z - 0.3))}>
                <MagnifyingGlassMinus size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">{dateBefore}</Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">{dateAfter}</Typography>
      </Box>
      <Box px={0} mt={0.5}>
        <Slider
          value={sliderPos}
          onChange={(_, val) => setSliderPos(val as number)}
          aria-label="Comparaison avant/après"
          sx={{
            color: "primary.main",
            "& .MuiSlider-thumb": { width: 20, height: 20, border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" },
            "& .MuiSlider-track": { height: 6, borderRadius: 3 },
            "& .MuiSlider-rail": { height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.1)" },
          }}
        />
      </Box>
    </Box>
  );
};

export default SatelliteImage;
