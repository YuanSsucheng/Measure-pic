import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Point,
  ToolMode,
  CalibrationData,
  Measurement,
  CanvasTransform,
} from '../types';
import {
  getDistance,
  getPolylineDistance,
  snapAngle,
  formatDistance,
  calculateRealDistance,
  getLineMidpoint,
} from '../utils/geometry';
import {
  Upload,
  FolderOpen,
  Ruler,
  Maximize2,
  ZoomIn,
  Move,
  Info,
} from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../utils/sampleImages';

interface MeasurementCanvasProps {
  imageSrc: string | null;
  imageElementRef: React.MutableRefObject<HTMLImageElement | null>;
  currentTool: ToolMode;
  calibration: CalibrationData | null;
  measurements: Measurement[];
  selectedMeasurementId: string | null;
  onSelectMeasurement: (id: string | null) => void;
  onAddMeasurement: (measurement: Measurement) => void;
  onUpdateMeasurementPoints: (id: string, points: Point[]) => void;
  onFinishCalibrationLine: (line: { start: Point; end: Point }) => void;
  onUpdateCalibrationPoints?: (start: Point, end: Point) => void;
  onHoverPoint: (pt: Point | null) => void;
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  onUploadImage: (file: File) => void;
  onSelectSample: (sample: SampleImage) => void;
  imageRotation: number;
}

interface DraggingEndpoint {
  type: 'calibration' | 'measurement';
  measurementId?: string;
  pointIndex: number; // 0 for start, 1 for end, or polyline index
}

export const MeasurementCanvas: React.FC<MeasurementCanvasProps> = ({
  imageSrc,
  imageElementRef,
  currentTool,
  calibration,
  measurements,
  selectedMeasurementId,
  onSelectMeasurement,
  onAddMeasurement,
  onUpdateMeasurementPoints,
  onFinishCalibrationLine,
  onUpdateCalibrationPoints,
  onHoverPoint,
  transform,
  setTransform,
  onUploadImage,
  onSelectSample,
  imageRotation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [polylinePoints, setPolylinePoints] = useState<Point[]>([]);

  // Panning state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging endpoint state
  const [draggingEndpoint, setDraggingEndpoint] = useState<DraggingEndpoint | null>(null);

  // Drag & drop file upload state
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Convert screen client coordinates to image pixel coordinates
  const screenToImage = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current || !imageElementRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const img = imageElementRef.current;
      const imgW = img.naturalWidth || 1000;
      const imgH = img.naturalHeight || 800;

      const imgX = (screenX - transform.x) / transform.scale;
      const imgY = (screenY - transform.y) / transform.scale;

      return {
        x: Math.max(0, Math.min(imgW, imgX)),
        y: Math.max(0, Math.min(imgH, imgY)),
      };
    },
    [transform, imageElementRef]
  );

  // Keyboard listeners for Space, Shift, Esc, Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Escape') {
        // cancel current drawing
        setDrawingStart(null);
        setPolylinePoints([]);
      }
      if (e.key === 'Enter' && polylinePoints.length >= 2) {
        finishPolyline();
      }

      // Nudge selected measurement point with Arrow keys
      if (selectedMeasurementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const m = measurements.find((item) => item.id === selectedMeasurementId);
        if (!m || m.points.length === 0) return;

        let dx = 0;
        let dy = 0;
        const step = e.shiftKey ? 10 : 1; // 10px if shift held, 1px normal
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        // Move the entire line or end point
        const newPoints = m.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        onUpdateMeasurementPoints(m.id, newPoints);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, polylinePoints, selectedMeasurementId, measurements, onUpdateMeasurementPoints]);

  // Finish current polyline
  const finishPolyline = () => {
    if (polylinePoints.length < 2) {
      setPolylinePoints([]);
      return;
    }
    const pixelDist = getPolylineDistance(polylinePoints);
    const realDist = calculateRealDistance(pixelDist, calibration);

    const newM: Measurement = {
      id: `m_${Date.now()}`,
      label: `折线测量 #${measurements.length + 1}`,
      color: '#0284c7',
      type: 'polyline',
      points: [...polylinePoints],
      pixelDistance: pixelDist,
      realDistance: realDist,
      unit: calibration?.unit || null,
      createdAt: Date.now(),
      visible: true,
    };

    onAddMeasurement(newM);
    setPolylinePoints([]);
  };

  // Mouse wheel zoom anchored to cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(0.1, Math.min(25, transform.scale * zoomFactor));

    // Keep point under cursor fixed:
    // cursorX = imgX * scale + x  => imgX = (cursorX - x) / scale
    // newCursorX = imgX * newScale + newX = cursorX
    const newX = cursorX - (cursorX - transform.x) * (newScale / transform.scale);
    const newY = cursorY - (cursorY - transform.y) * (newScale / transform.scale);

    setTransform({
      scale: newScale,
      x: newX,
      y: newY,
    });
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Pan mode or Space key or Middle Click (button === 1)
    if (currentTool === 'pan' || isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      return;
    }

    if (e.button !== 0) return; // Only left click for drawing

    const rawPos = screenToImage(e.clientX, e.clientY);
    const pos = isShiftPressed && drawingStart ? snapAngle(drawingStart, rawPos) : rawPos;

    // 2. Endpoint dragging (if triggered via endpoint handle onMouseDown)
    if (draggingEndpoint) {
      return;
    }

    // 3. Calibrate tool
    if (currentTool === 'calibrate') {
      if (!drawingStart) {
        setDrawingStart(pos);
      } else {
        // Complete calibration line
        onFinishCalibrationLine({ start: drawingStart, end: pos });
        setDrawingStart(null);
      }
      return;
    }

    // 4. Line tool
    if (currentTool === 'line') {
      if (!drawingStart) {
        setDrawingStart(pos);
      } else {
        // Complete straight measurement line
        const pixelDist = getDistance(drawingStart, pos);
        if (pixelDist > 2) {
          const realDist = calculateRealDistance(pixelDist, calibration);
          const newM: Measurement = {
            id: `m_${Date.now()}`,
            label: `测量 #${measurements.length + 1}`,
            color: '#0284c7',
            type: 'line',
            points: [drawingStart, pos],
            pixelDistance: pixelDist,
            realDistance: realDist,
            unit: calibration?.unit || null,
            createdAt: Date.now(),
            visible: true,
          };
          onAddMeasurement(newM);
        }
        setDrawingStart(null);
      }
      return;
    }

    // 5. Polyline tool
    if (currentTool === 'polyline') {
      setPolylinePoints((prev) => [...prev, pos]);
      return;
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Pan move
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    const rawPos = screenToImage(e.clientX, e.clientY);
    const pos = isShiftPressed && drawingStart ? snapAngle(drawingStart, rawPos) : rawPos;
    setCurrentMousePos(pos);
    onHoverPoint(pos);

    // 2. Dragging endpoint of existing line
    if (draggingEndpoint) {
      if (draggingEndpoint.type === 'calibration' && calibration && onUpdateCalibrationPoints) {
        if (draggingEndpoint.pointIndex === 0) {
          onUpdateCalibrationPoints(pos, calibration.end);
        } else {
          onUpdateCalibrationPoints(calibration.start, pos);
        }
      } else if (draggingEndpoint.type === 'measurement' && draggingEndpoint.measurementId) {
        const m = measurements.find((item) => item.id === draggingEndpoint.measurementId);
        if (m) {
          const newPoints = [...m.points];
          newPoints[draggingEndpoint.pointIndex] = pos;
          onUpdateMeasurementPoints(m.id, newPoints);
        }
      }
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingEndpoint) {
      setDraggingEndpoint(null);
    }
  };

  // Double Click for polyline finish
  const handleDoubleClick = () => {
    if (currentTool === 'polyline') {
      finishPolyline();
    }
  };

  // File Drag & Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadImage(e.dataTransfer.files[0]);
    }
  };

  // Cursor style
  let cursorClass = 'cursor-default';
  if (isPanning || (isSpacePressed && !isPanning)) {
    cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (currentTool === 'pan') {
    cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (currentTool === 'calibrate' || currentTool === 'line' || currentTool === 'polyline') {
    cursorClass = 'cursor-crosshair';
  } else if (draggingEndpoint) {
    cursorClass = 'cursor-grabbing';
  }

  // Active preview line calculation
  const activeEndPoint = currentMousePos
    ? isShiftPressed && drawingStart
      ? snapAngle(drawingStart, currentMousePos)
      : currentMousePos
    : null;

  const previewPixelLength =
    drawingStart && activeEndPoint ? getDistance(drawingStart, activeEndPoint) : 0;
  const previewFormatted = formatDistance(previewPixelLength, calibration);

  return (
    <div
      ref={containerRef}
      id="measurement-canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 h-full w-full overflow-hidden bg-slate-900 select-none ${cursorClass}`}
    >
      {/* Background Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* When no image is loaded yet: Dropzone & Sample Picker */}
      {!imageSrc ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl bg-slate-800/80 p-8 text-center shadow-2xl backdrop-blur-md ring-1 ring-white/10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-white">导入静态图片开始测距</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              支持 PNG, JPG, JPEG, WEBP, SVG 等多种格式。通过划定已知线段标定比例，即可精准测量全图任意尺寸。
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <label
                id="dropzone-upload-label"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-500 transition"
              >
                <Upload className="h-4 w-4" />
                <span>从电脑选择图片</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/bmp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onUploadImage(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Quick samples */}
            <div className="mt-8 border-t border-slate-700/60 pt-6">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
                <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
                <span>或者立即载入快速测试样例：</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample)}
                    className="group rounded-xl border border-slate-700 bg-slate-800/90 p-3 hover:border-sky-500/50 hover:bg-slate-700/50 transition"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-sky-300">
                      {sample.name}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                      {sample.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Image + SVG Overlay Container with Pan/Zoom Transform */
        <div
          id="canvas-viewport"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
          className="absolute top-0 left-0"
        >
          {/* Base Image */}
          <img
            ref={imageElementRef}
            src={imageSrc}
            alt="Measuring Subject"
            draggable={false}
            style={{
              transform: `rotate(${imageRotation}deg)`,
              transformOrigin: 'center center',
            }}
            className="block max-w-none pointer-events-none select-none shadow-2xl"
          />

          {/* Dimension & Annotation SVG Layer */}
          <svg
            id="dimension-svg-layer"
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
          >
            <defs>
              {/* Filter for crisp badge shadow */}
              <filter id="badge-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* 1. Calibration Reference Line */}
            {calibration && (
              <g id="calibration-layer" className="pointer-events-auto">
                {/* Dashed reference line */}
                <line
                  x1={calibration.start.x}
                  y1={calibration.start.y}
                  x2={calibration.end.x}
                  y2={calibration.end.y}
                  stroke="#f59e0b"
                  strokeWidth={2.5 / transform.scale}
                  strokeDasharray={`${6 / transform.scale} ${4 / transform.scale}`}
                />

                {/* Perpendicular ticks at endpoints */}
                <DimensionTicks
                  p1={calibration.start}
                  p2={calibration.end}
                  color="#f59e0b"
                  scale={transform.scale}
                />

                {/* Calibration endpoints (draggable in 'select' mode) */}
                <circle
                  cx={calibration.start.x}
                  cy={calibration.start.y}
                  r={5 / transform.scale}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={1.5 / transform.scale}
                  className={currentTool === 'select' ? 'cursor-grab pointer-events-auto' : ''}
                  onMouseDown={(e) => {
                    if (currentTool === 'select') {
                      e.stopPropagation();
                      setDraggingEndpoint({ type: 'calibration', pointIndex: 0 });
                    }
                  }}
                />
                <circle
                  cx={calibration.end.x}
                  cy={calibration.end.y}
                  r={5 / transform.scale}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={1.5 / transform.scale}
                  className={currentTool === 'select' ? 'cursor-grab pointer-events-auto' : ''}
                  onMouseDown={(e) => {
                    if (currentTool === 'select') {
                      e.stopPropagation();
                      setDraggingEndpoint({ type: 'calibration', pointIndex: 1 });
                    }
                  }}
                />

                {/* Calibration Badge */}
                <DimensionBadge
                  point={getLineMidpoint(calibration.start, calibration.end)}
                  text={`已知基准: ${calibration.knownLength} ${calibration.unit}`}
                  bgColor="#b45309"
                  textColor="#ffffff"
                  scale={transform.scale}
                />
              </g>
            )}

            {/* 2. Finished Measurements */}
            {measurements.map((m) => {
              if (!m.visible || m.points.length < 2) return null;
              const isSelected = selectedMeasurementId === m.id;
              const lineWidth = (isSelected ? 3.5 : 2.5) / transform.scale;

              const valText =
                m.realDistance !== null && m.unit
                  ? `${m.realDistance} ${m.unit}`
                  : `${m.pixelDistance.toFixed(1)} px`;

              const labelText = `${m.label || '测量'}: ${valText}`;

              return (
                <g
                  key={m.id}
                  id={`svg-measurement-${m.id}`}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMeasurement(m.id);
                  }}
                >
                  {/* Selection glow if active */}
                  {isSelected && m.type === 'line' && (
                    <line
                      x1={m.points[0].x}
                      y1={m.points[0].y}
                      x2={m.points[1].x}
                      y2={m.points[1].y}
                      stroke="#38bdf8"
                      strokeWidth={8 / transform.scale}
                      strokeOpacity={0.3}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Line */}
                  {m.type === 'line' ? (
                    <>
                      <line
                        x1={m.points[0].x}
                        y1={m.points[0].y}
                        x2={m.points[1].x}
                        y2={m.points[1].y}
                        stroke={m.color}
                        strokeWidth={lineWidth}
                      />
                      <DimensionTicks
                        p1={m.points[0]}
                        p2={m.points[1]}
                        color={m.color}
                        scale={transform.scale}
                      />
                    </>
                  ) : (
                    /* Polyline */
                    <polyline
                      points={m.points.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={m.color}
                      strokeWidth={lineWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Endpoints */}
                  {m.points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={(isSelected ? 6 : 4.5) / transform.scale}
                      fill="#ffffff"
                      stroke={m.color}
                      strokeWidth={2 / transform.scale}
                      className={currentTool === 'select' ? 'cursor-grab pointer-events-auto' : ''}
                      onMouseDown={(e) => {
                        if (currentTool === 'select') {
                          e.stopPropagation();
                          onSelectMeasurement(m.id);
                          setDraggingEndpoint({
                            type: 'measurement',
                            measurementId: m.id,
                            pointIndex: pIdx,
                          });
                        }
                      }}
                    />
                  ))}

                  {/* Dimension Text Pill */}
                  <DimensionBadge
                    point={
                      m.type === 'line'
                        ? getLineMidpoint(m.points[0], m.points[1])
                        : m.points[Math.floor(m.points.length / 2)]
                    }
                    text={labelText}
                    bgColor="#0f172a"
                    textColor="#ffffff"
                    scale={transform.scale}
                    borderColor={m.color}
                  />
                </g>
              );
            })}

            {/* 3. Drawing Preview Line (Straight Line or Calibration) */}
            {drawingStart && activeEndPoint && (
              <g id="drawing-preview-line" className="pointer-events-none">
                <line
                  x1={drawingStart.x}
                  y1={drawingStart.y}
                  x2={activeEndPoint.x}
                  y2={activeEndPoint.y}
                  stroke={currentTool === 'calibrate' ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2.5 / transform.scale}
                  strokeDasharray={
                    currentTool === 'calibrate' ? `${6 / transform.scale} ${4 / transform.scale}` : undefined
                  }
                />
                <DimensionTicks
                  p1={drawingStart}
                  p2={activeEndPoint}
                  color={currentTool === 'calibrate' ? '#f59e0b' : '#38bdf8'}
                  scale={transform.scale}
                />
                <circle
                  cx={drawingStart.x}
                  cy={drawingStart.y}
                  r={5 / transform.scale}
                  fill="#ffffff"
                  stroke={currentTool === 'calibrate' ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2 / transform.scale}
                />
                <circle
                  cx={activeEndPoint.x}
                  cy={activeEndPoint.y}
                  r={5 / transform.scale}
                  fill="#ffffff"
                  stroke={currentTool === 'calibrate' ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2 / transform.scale}
                />

                {/* Floating Preview Badge */}
                <DimensionBadge
                  point={getLineMidpoint(drawingStart, activeEndPoint)}
                  text={
                    currentTool === 'calibrate'
                      ? `标定线: ${previewPixelLength.toFixed(1)} px`
                      : previewFormatted.text
                  }
                  bgColor="#0f172a"
                  textColor="#38bdf8"
                  scale={transform.scale}
                  borderColor="#38bdf8"
                />
              </g>
            )}

            {/* 4. Drawing Polyline in progress */}
            {polylinePoints.length > 0 && (
              <g id="polyline-drawing-preview" className="pointer-events-none">
                <polyline
                  points={[
                    ...polylinePoints.map((p) => `${p.x},${p.y}`),
                    activeEndPoint ? `${activeEndPoint.x},${activeEndPoint.y}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5 / transform.scale}
                  strokeDasharray={`${5 / transform.scale} ${3 / transform.scale}`}
                />
                {polylinePoints.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={4.5 / transform.scale}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={1.5 / transform.scale}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Floating Status / Instructions Pill */}
      {imageSrc && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-lg border border-white/10">
          <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>
            {currentTool === 'calibrate' && '点击设定已知线段的起点与终点以标定比例'}
            {currentTool === 'line' && '点击两点绘制测量直线 (按住 Shift 键锁定正交方向)'}
            {currentTool === 'polyline' && '连续点击绘制折线，双击或按 Enter 结束'}
            {currentTool === 'select' && '拖动任意端点可微调位置，方向键进行 1px 精准微调'}
            {currentTool === 'pan' && '按住鼠标左键拖动画布浏览'}
          </span>
        </div>
      )}

      {/* Drag & drop overlay indicator */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-sky-950/80 backdrop-blur-sm border-4 border-dashed border-sky-400">
          <div className="text-center text-white">
            <Upload className="mx-auto h-12 w-12 text-sky-400 animate-bounce" />
            <p className="mt-2 text-lg font-bold">释放图片以立即导入</p>
            <p className="text-xs text-slate-300">支持 PNG, JPG, JPEG, WEBP, SVG</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for CAD-style dimension extension ticks
const DimensionTicks: React.FC<{
  p1: Point;
  p2: Point;
  color: string;
  scale: number;
}> = ({ p1, p2, color, scale }) => {
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perpAngle = angle + Math.PI / 2;
  const tickLen = 14 / scale;
  const dx = Math.cos(perpAngle) * (tickLen / 2);
  const dy = Math.sin(perpAngle) * (tickLen / 2);
  const strokeWidth = 1.5 / scale;

  return (
    <g className="pointer-events-none">
      <line
        x1={p1.x - dx}
        y1={p1.y - dy}
        x2={p1.x + dx}
        y2={p1.y + dy}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <line
        x1={p2.x - dx}
        y1={p2.y - dy}
        x2={p2.x + dx}
        y2={p2.y + dy}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </g>
  );
};

// Sub-component for high-contrast, scalable text pill badge
const DimensionBadge: React.FC<{
  point: Point;
  text: string;
  bgColor: string;
  textColor: string;
  scale: number;
  borderColor?: string;
}> = ({ point, text, bgColor, textColor, scale, borderColor }) => {
  // We keep the badge size visually readable by scaling inversely with zoom
  const fontSize = 12 / Math.min(Math.max(scale, 0.4), 3.5);
  const paddingX = fontSize * 0.7;
  const paddingY = fontSize * 0.35;
  const approxWidth = text.length * fontSize * 0.65 + paddingX * 2;
  const height = fontSize + paddingY * 2;

  return (
    <g
      transform={`translate(${point.x}, ${point.y - 12 / scale})`}
      className="pointer-events-none select-none"
    >
      <rect
        x={-approxWidth / 2}
        y={-height / 2}
        width={approxWidth}
        height={height}
        rx={4 / scale}
        fill={bgColor}
        stroke={borderColor || 'rgba(255, 255, 255, 0.25)'}
        strokeWidth={1 / scale}
        filter="url(#badge-shadow)"
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={fontSize}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        {text}
      </text>
    </g>
  );
};
