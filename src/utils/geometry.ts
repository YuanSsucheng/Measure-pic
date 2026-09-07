import { Point, Unit, CalibrationData, Measurement } from '../types';

export const UNIT_LABELS: Record<Unit, string> = {
  mm: '毫米 (mm)',
  cm: '厘米 (cm)',
  m: '米 (m)',
  in: '英寸 (in)',
  ft: '英尺 (ft)',
  px: '像素 (px)',
};

export const UNIT_CONVERSIONS_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
  px: 1, // fallback
};

export function getDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function getPolylineDistance(points: Point[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += getDistance(points[i], points[i + 1]);
  }
  return total;
}

export function snapAngle(start: Point, current: Point, angleStepDeg = 45): Point {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return current;

  const angle = Math.atan2(dy, dx);
  const stepRad = (angleStepDeg * Math.PI) / 180;
  const snappedAngle = Math.round(angle / stepRad) * stepRad;

  return {
    x: Math.round(start.x + dist * Math.cos(snappedAngle)),
    y: Math.round(start.y + dist * Math.sin(snappedAngle)),
  };
}

export function formatDistance(
  pixelDist: number,
  calibration: CalibrationData | null,
  precision = 2
): { text: string; value: number | null; unit: Unit | 'px' } {
  if (!calibration || calibration.pixelsPerUnit <= 0) {
    return {
      text: `${pixelDist.toFixed(1)} px`,
      value: pixelDist,
      unit: 'px',
    };
  }

  const realVal = pixelDist * calibration.unitsPerPixel;
  return {
    text: `${realVal.toFixed(precision)} ${calibration.unit}`,
    value: Number(realVal.toFixed(precision)),
    unit: calibration.unit,
  };
}

export function calculateRealDistance(
  pixelDist: number,
  calibration: CalibrationData | null
): number | null {
  if (!calibration || calibration.pixelsPerUnit <= 0) return null;
  return Number((pixelDist * calibration.unitsPerPixel).toFixed(4));
}

// Convert a measurement line to parallel dimension offset if needed
export function getLineMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function getLineAngleDeg(p1: Point, p2: Point): number {
  const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  return angle;
}

/**
 * Render the entire image + annotations on an offscreen canvas and export as PNG
 */
export async function exportAnnotatedImage(
  imgElement: HTMLImageElement,
  calibration: CalibrationData | null,
  measurements: Measurement[],
  imageRotation: number = 0,
  filename = 'measured_image.png'
): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isRotated = imageRotation === 90 || imageRotation === 270;
  const width = isRotated ? imgElement.naturalHeight : imgElement.naturalWidth;
  const height = isRotated ? imgElement.naturalWidth : imgElement.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  // Draw background image with rotation if any
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((imageRotation * Math.PI) / 180);
  ctx.drawImage(
    imgElement,
    -imgElement.naturalWidth / 2,
    -imgElement.naturalHeight / 2
  );
  ctx.restore();

  const scaleFactor = Math.max(1, Math.min(width, height) / 1000);
  const lineWidth = Math.max(2, Math.round(2.5 * scaleFactor));
  const fontSize = Math.max(12, Math.round(14 * scaleFactor));

  // 1. Draw Calibration Line if present
  if (calibration) {
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([8 * scaleFactor, 4 * scaleFactor]);

    // Line
    ctx.beginPath();
    ctx.moveTo(calibration.start.x, calibration.start.y);
    ctx.lineTo(calibration.end.x, calibration.end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Endpoints
    [calibration.start, calibration.end].forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * scaleFactor;
      ctx.stroke();
    });

    // Label
    const mid = getLineMidpoint(calibration.start, calibration.end);
    const labelText = `基准标定: ${calibration.knownLength} ${calibration.unit}`;
    drawTextBadge(ctx, labelText, mid.x, mid.y - 12 * scaleFactor, fontSize, '#f59e0b', '#ffffff');
    ctx.restore();
  }

  // 2. Draw Measurements
  measurements.forEach((m, idx) => {
    if (!m.visible || m.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = m.color;
    ctx.fillStyle = m.color;
    ctx.lineWidth = lineWidth;

    // Draw line or polyline
    ctx.beginPath();
    ctx.moveTo(m.points[0].x, m.points[0].y);
    for (let i = 1; i < m.points.length; i++) {
      ctx.lineTo(m.points[i].x, m.points[i].y);
    }
    ctx.stroke();

    // Draw end ticks / perpendicular lines for straight line
    if (m.type === 'line' && m.points.length === 2) {
      drawDimensionTicks(ctx, m.points[0], m.points[1], 8 * scaleFactor, lineWidth);
    }

    // Points
    m.points.forEach((p, pIdx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * scaleFactor, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2 * scaleFactor;
      ctx.stroke();
    });

    // Measurement badge
    const valText = m.realDistance !== null && m.unit
      ? `${m.realDistance} ${m.unit}`
      : `${m.pixelDistance.toFixed(1)} px`;
    const labelText = `${m.label || `测量 #${idx + 1}`}: ${valText}`;
    
    let labelPos: Point;
    if (m.type === 'line' && m.points.length === 2) {
      labelPos = getLineMidpoint(m.points[0], m.points[1]);
    } else {
      labelPos = m.points[Math.floor(m.points.length / 2)];
    }

    drawTextBadge(ctx, labelText, labelPos.x, labelPos.y - 12 * scaleFactor, fontSize, '#0f172a', '#38bdf8');
    ctx.restore();
  });

  // 3. Draw Scale Legend bar at bottom right
  if (calibration && calibration.pixelsPerUnit > 0) {
    drawScaleBar(ctx, width, height, calibration, scaleFactor);
  }

  // Download image
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function drawTextBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  bgColor: string,
  textColor: string
) {
  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.4;
  const boxWidth = metrics.width + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;
  const radius = 4;

  const rx = x - boxWidth / 2;
  const ry = y - boxHeight / 2;

  // Background rounded rect
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(rx, ry, boxWidth, boxHeight, radius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawDimensionTicks(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  tickLength: number,
  lineWidth: number
) {
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perpAngle = angle + Math.PI / 2;
  const dx = Math.cos(perpAngle) * (tickLength / 2);
  const dy = Math.sin(perpAngle) * (tickLength / 2);

  ctx.beginPath();
  // Tick at p1
  ctx.moveTo(p1.x - dx, p1.y - dy);
  ctx.lineTo(p1.x + dx, p1.y + dy);
  // Tick at p2
  ctx.moveTo(p2.x - dx, p2.y - dy);
  ctx.lineTo(p2.x + dx, p2.y + dy);
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  calibration: CalibrationData,
  scaleFactor: number
) {
  ctx.save();
  // Choose round unit length: 1, 2, 5, 10, 20, 50, 100, etc.
  const targetPx = 140 * scaleFactor;
  const rawUnits = targetPx / calibration.pixelsPerUnit;
  const niceUnits = getNiceNumber(rawUnits);
  const barPx = niceUnits * calibration.pixelsPerUnit;

  const margin = 24 * scaleFactor;
  const x = width - margin - barPx;
  const y = height - margin;

  // Background plate
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 12 * scaleFactor, y - 28 * scaleFactor, barPx + 24 * scaleFactor, 36 * scaleFactor, 6);
  ctx.fill();
  ctx.stroke();

  // Scale line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5 * scaleFactor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + barPx, y);
  // Left and right caps
  ctx.moveTo(x, y - 4 * scaleFactor);
  ctx.lineTo(x, y + 4 * scaleFactor);
  ctx.moveTo(x + barPx, y - 4 * scaleFactor);
  ctx.lineTo(x + barPx, y + 4 * scaleFactor);
  ctx.stroke();

  // Text
  ctx.font = `600 ${Math.max(10, Math.round(11 * scaleFactor))}px system-ui, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.fillText(`${niceUnits} ${calibration.unit}`, x + barPx / 2, y - 10 * scaleFactor);

  ctx.restore();
}

function getNiceNumber(val: number): number {
  const exp = Math.floor(Math.log10(val));
  const frac = val / Math.pow(10, exp);
  let niceFrac = 1;
  if (frac >= 7.5) niceFrac = 10;
  else if (frac >= 3.5) niceFrac = 5;
  else if (frac >= 1.5) niceFrac = 2;
  else niceFrac = 1;
  return niceFrac * Math.pow(10, exp);
}
