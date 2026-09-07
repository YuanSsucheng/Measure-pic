export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'ft' | 'px';

export interface Point {
  x: number;
  y: number;
}

export interface CalibrationData {
  start: Point;
  end: Point;
  knownLength: number;
  unit: Unit;
  pixelLength: number;
  pixelsPerUnit: number; // pixels / real unit
  unitsPerPixel: number; // real unit / pixel
}

export type ToolMode = 'select' | 'calibrate' | 'line' | 'polyline' | 'pan';

export interface Measurement {
  id: string;
  label: string;
  color: string;
  type: 'line' | 'polyline';
  points: Point[];
  pixelDistance: number;
  realDistance: number | null; // calculated via calibration
  unit: Unit | null;
  createdAt: number;
  visible: boolean;
}

export interface CanvasTransform {
  scale: number;
  x: number;
  y: number;
}

export interface ImageInfo {
  name: string;
  width: number;
  height: number;
  src: string;
  rotation: number; // 0, 90, 180, 270
}
