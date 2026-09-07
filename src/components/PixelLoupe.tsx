import React, { useRef, useEffect } from 'react';
import { Point } from '../types';
import { ZoomIn, X } from 'lucide-react';

interface PixelLoupeProps {
  imageElement: HTMLImageElement | null;
  point: Point | null;
  enabled: boolean;
  onToggle: () => void;
  rotation?: number;
}

export const PixelLoupe: React.FC<PixelLoupeProps> = ({
  imageElement,
  point,
  enabled,
  onToggle,
  rotation = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current || !imageElement || !point) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zoom = 7; // 7x zoom factor
    const size = canvas.width;
    const center = size / 2;
    const halfSource = center / zoom;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false; // pixelated look

    ctx.save();
    // Clip round lens
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background dark neutral
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Draw source portion
    // Handle image rotation
    ctx.save();
    ctx.translate(center, center);

    const sx = point.x - halfSource;
    const sy = point.y - halfSource;
    const sWidth = halfSource * 2;
    const sHeight = halfSource * 2;

    try {
      ctx.drawImage(
        imageElement,
        sx,
        sy,
        sWidth,
        sHeight,
        -center,
        -center,
        size,
        size
      );
    } catch {
      // Ignored in case image is out of bounds or cross-origin
    }
    ctx.restore();

    // Subtle pixel grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    const gridStep = zoom;
    for (let x = (center % gridStep); x < size; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = (center % gridStep); y < size; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Crosshairs centered on the exact pixel
    ctx.strokeStyle = '#ef4444'; // red center crosshair
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Horizontal crosshair with center gap
    ctx.moveTo(0, center);
    ctx.lineTo(center - 5, center);
    ctx.moveTo(center + 5, center);
    ctx.lineTo(size, center);
    // Vertical crosshair with center gap
    ctx.moveTo(center, 0);
    ctx.lineTo(center, center - 5);
    ctx.moveTo(center, center + 5);
    ctx.lineTo(center, size);
    ctx.stroke();

    // Center targeting circle
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Outer lens border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [enabled, imageElement, point, rotation]);

  if (!enabled) return null;

  return (
    <div
      id="pixel-loupe-container"
      className="absolute bottom-5 left-5 z-30 pointer-events-auto rounded-2xl bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md ring-1 ring-white/10 text-white select-none transition"
    >
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <ZoomIn className="h-3.5 w-3.5 text-sky-400" />
          <span>微米级像素放大镜 (7×)</span>
        </div>
        <button
          id="close-loupe-btn"
          onClick={onToggle}
          className="rounded-md p-0.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="关闭放大镜"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            className="rounded-full shadow-inner block"
          />
        </div>

        <div className="mt-2 flex items-center justify-between w-full px-1 text-[11px] font-mono text-slate-300">
          <span>坐标:</span>
          {point ? (
            <span className="font-semibold text-sky-300">
              X:{Math.round(point.x)} Y:{Math.round(point.y)}
            </span>
          ) : (
            <span className="text-slate-500">将光标移至画布</span>
          )}
        </div>
      </div>
    </div>
  );
};
