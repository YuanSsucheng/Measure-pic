import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ToolMode,
  CalibrationData,
  Measurement,
  CanvasTransform,
  Point,
} from './types';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { MeasurementCanvas } from './components/MeasurementCanvas';
import { CalibrationDialog } from './components/CalibrationDialog';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PixelLoupe } from './components/PixelLoupe';
import { SAMPLE_IMAGES, SampleImage } from './utils/sampleImages';
import { exportAnnotatedImage, calculateRealDistance, getDistance } from './utils/geometry';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('sample.png');
  const [imageRotation, setImageRotation] = useState<number>(0);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Tools & Canvas State
  const [currentTool, setCurrentTool] = useState<ToolMode>('line');
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ scale: 1, x: 50, y: 50 });

  // Loupe & Interaction State
  const [loupeEnabled, setLoupeEnabled] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  // Dialogs
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [tempCalibrationLine, setTempCalibrationLine] = useState<{ start: Point; end: Point } | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Load default sample on mount
  useEffect(() => {
    const defaultSample = SAMPLE_IMAGES[0];
    loadSample(defaultSample);
  }, []);

  const loadSample = (sample: SampleImage) => {
    setImageSrc(sample.src);
    setImageName(`${sample.id}.svg`);
    setImageRotation(0);
    setMeasurements([]);
    setSelectedMeasurementId(null);

    // Provide initial sample calibration and a sample measurement line
    if (sample.id === 'mechanical-part') {
      // Coin diameter is 180px for 25.0 mm
      const startPt = { x: 920, y: 450 };
      const endPt = { x: 1100, y: 450 };
      const pxLen = getDistance(startPt, endPt);
      const calib: CalibrationData = {
        start: startPt,
        end: endPt,
        knownLength: 25,
        unit: 'mm',
        pixelLength: pxLen,
        pixelsPerUnit: pxLen / 25,
        unitsPerPixel: 25 / pxLen,
      };
      setCalibration(calib);

      // Add a couple of initial sample measurement lines
      const m1Points = [{ x: 240, y: 280 }, { x: 700, y: 280 }];
      const m1Px = getDistance(m1Points[0], m1Points[1]);
      const m2Points = [{ x: 380, y: 230 }, { x: 380, y: 330 }];
      const m2Px = getDistance(m2Points[0], m2Points[1]);

      setMeasurements([
        {
          id: 'sample_m1',
          label: '连杆两孔中心间距',
          color: '#0284c7',
          type: 'line',
          points: m1Points,
          pixelDistance: m1Px,
          realDistance: calculateRealDistance(m1Px, calib),
          unit: 'mm',
          createdAt: Date.now() - 2000,
          visible: true,
        },
        {
          id: 'sample_m2',
          label: '中心圆孔直径',
          color: '#10b981',
          type: 'line',
          points: m2Points,
          pixelDistance: m2Px,
          realDistance: calculateRealDistance(m2Px, calib),
          unit: 'mm',
          createdAt: Date.now() - 1000,
          visible: true,
        },
      ]);
    } else {
      setCalibration(null);
    }

    // Auto fit
    setTimeout(() => {
      fitToScreen();
    }, 100);
  };

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImageSrc(e.target.result);
        setImageName(file.name);
        setImageRotation(0);
        setCalibration(null);
        setMeasurements([]);
        setSelectedMeasurementId(null);
        setCurrentTool('calibrate'); // Prompt user to calibrate first!

        setTimeout(() => {
          fitToScreen();
        }, 150);
      }
    };
    reader.readAsDataURL(file);
  };

  // Canvas zoom/pan controls
  const fitToScreen = useCallback(() => {
    if (!imageElementRef.current) return;
    const container = document.getElementById('measurement-canvas-container');
    if (!container) return;

    const imgW = imageElementRef.current.naturalWidth || 1200;
    const imgH = imageElementRef.current.naturalHeight || 800;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const scaleX = (containerW - 80) / imgW;
    const scaleY = (containerH - 80) / imgH;
    const bestScale = Math.max(0.1, Math.min(scaleX, scaleY, 2));

    const x = (containerW - imgW * bestScale) / 2;
    const y = (containerH - imgH * bestScale) / 2;

    setTransform({
      scale: Number(bestScale.toFixed(3)),
      x: Math.round(x),
      y: Math.round(y),
    });
  }, []);

  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(25, Number((prev.scale * 1.25).toFixed(3))),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Number((prev.scale / 1.25).toFixed(3))),
    }));
  };

  const handleResetZoom = () => {
    setTransform((prev) => ({
      ...prev,
      scale: 1,
    }));
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Calibration line finished
  const handleFinishCalibrationLine = (line: { start: Point; end: Point }) => {
    setTempCalibrationLine(line);
    setIsCalibrationOpen(true);
  };

  const handleConfirmCalibration = (newCalib: CalibrationData) => {
    setCalibration(newCalib);
    setTempCalibrationLine(null);

    // Re-calculate existing measurements with new calibration ratio
    setMeasurements((prev) =>
      prev.map((m) => ({
        ...m,
        realDistance: calculateRealDistance(m.pixelDistance, newCalib),
        unit: newCalib.unit,
      }))
    );

    // Switch tool to measure line
    setCurrentTool('line');
  };

  const handleUpdateCalibrationPoints = (start: Point, end: Point) => {
    if (!calibration) return;
    const pixelLen = getDistance(start, end);
    const pixelsPerUnit = pixelLen / calibration.knownLength;
    const unitsPerPixel = calibration.knownLength / pixelLen;

    const updated: CalibrationData = {
      ...calibration,
      start,
      end,
      pixelLength: pixelLen,
      pixelsPerUnit,
      unitsPerPixel,
    };
    setCalibration(updated);

    // Update measurements
    setMeasurements((prev) =>
      prev.map((m) => ({
        ...m,
        realDistance: calculateRealDistance(m.pixelDistance, updated),
      }))
    );
  };

  // Measurement management
  const handleAddMeasurement = (newM: Measurement) => {
    setMeasurements((prev) => [...prev, newM]);
    setSelectedMeasurementId(newM.id);
  };

  const handleUpdateMeasurementPoints = (id: string, newPoints: Point[]) => {
    setMeasurements((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const pixelDist =
          m.type === 'line'
            ? getDistance(newPoints[0], newPoints[1])
            : getDistance(newPoints[0], newPoints[1]); // polyline distance can be calculated if needed
        return {
          ...m,
          points: newPoints,
          pixelDistance: pixelDist,
          realDistance: calculateRealDistance(pixelDist, calibration),
        };
      })
    );
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    if (selectedMeasurementId === id) {
      setSelectedMeasurementId(null);
    }
  };

  const handleToggleVisibility = (id: string) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m))
    );
  };

  const handleUpdateLabel = (id: string, label: string) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, label } : m))
    );
  };

  const handleUpdateColor = (id: string, color: string) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, color } : m))
    );
  };

  const handleClearMeasurements = () => {
    if (measurements.length === 0) return;
    if (window.confirm('确定要清空所有测量记录吗？')) {
      setMeasurements([]);
      setSelectedMeasurementId(null);
    }
  };

  const handleDeleteCalibration = () => {
    if (window.confirm('确定要清除标定数据吗？清除后所有测量将仅显示像素值。')) {
      setCalibration(null);
      setMeasurements((prev) =>
        prev.map((m) => ({
          ...m,
          realDistance: null,
          unit: null,
        }))
      );
    }
  };

  const handleExportImage = () => {
    if (!imageElementRef.current) return;
    const baseName = imageName.replace(/\.[^/.]+$/, '');
    exportAnnotatedImage(
      imageElementRef.current,
      calibration,
      measurements,
      imageRotation,
      `${baseName}_measured.png`
    );
  };

  return (
    <div id="image-measurement-app" className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 font-sans">
      {/* 1. Top Application Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        calibration={calibration}
        onOpenCalibrationDialog={() => {
          if (calibration) {
            setTempCalibrationLine({ start: calibration.start, end: calibration.end });
            setIsCalibrationOpen(true);
          } else {
            setCurrentTool('calibrate');
          }
        }}
        onUploadImage={handleUploadImage}
        onSelectSample={loadSample}
        zoom={transform.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitZoom={fitToScreen}
        onRotate={handleRotate}
        loupeEnabled={loupeEnabled}
        onToggleLoupe={() => setLoupeEnabled(!loupeEnabled)}
        onExportImage={handleExportImage}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasImage={Boolean(imageSrc)}
      />

      {/* 2. Main Workspace: Canvas & Sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Interactive Measurement Canvas */}
        <MeasurementCanvas
          imageSrc={imageSrc}
          imageElementRef={imageElementRef}
          currentTool={currentTool}
          calibration={calibration}
          measurements={measurements}
          selectedMeasurementId={selectedMeasurementId}
          onSelectMeasurement={setSelectedMeasurementId}
          onAddMeasurement={handleAddMeasurement}
          onUpdateMeasurementPoints={handleUpdateMeasurementPoints}
          onFinishCalibrationLine={handleFinishCalibrationLine}
          onUpdateCalibrationPoints={handleUpdateCalibrationPoints}
          onHoverPoint={setHoveredPoint}
          transform={transform}
          setTransform={setTransform}
          onUploadImage={handleUploadImage}
          onSelectSample={loadSample}
          imageRotation={imageRotation}
        />

        {/* Pixel Magnifier Lens */}
        <PixelLoupe
          imageElement={imageElementRef.current}
          point={hoveredPoint}
          enabled={loupeEnabled && Boolean(imageSrc)}
          onToggle={() => setLoupeEnabled(false)}
          rotation={imageRotation}
        />

        {/* Right Sidebar */}
        <Sidebar
          calibration={calibration}
          measurements={measurements}
          selectedMeasurementId={selectedMeasurementId}
          onSelectMeasurement={setSelectedMeasurementId}
          onDeleteMeasurement={handleDeleteMeasurement}
          onToggleVisibility={handleToggleVisibility}
          onUpdateLabel={handleUpdateLabel}
          onUpdateColor={handleUpdateColor}
          onClearMeasurements={handleClearMeasurements}
          onStartCalibration={() => setCurrentTool('calibrate')}
          onEditCalibration={() => {
            if (calibration) {
              setTempCalibrationLine({ start: calibration.start, end: calibration.end });
              setIsCalibrationOpen(true);
            }
          }}
          onDeleteCalibration={handleDeleteCalibration}
          onExportAnnotatedImage={handleExportImage}
        />
      </div>

      {/* 3. Calibration Input Modal */}
      <CalibrationDialog
        isOpen={isCalibrationOpen}
        onClose={() => {
          setIsCalibrationOpen(false);
          setTempCalibrationLine(null);
        }}
        onConfirm={handleConfirmCalibration}
        tempLine={tempCalibrationLine}
        currentCalibration={calibration}
      />

      {/* 4. Shortcuts & Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
