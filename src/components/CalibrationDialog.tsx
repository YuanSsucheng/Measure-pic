import React, { useState, useEffect } from 'react';
import { Unit, Point, CalibrationData } from '../types';
import { UNIT_LABELS, getDistance } from '../utils/geometry';
import { Check, X, Ruler, Sparkles } from 'lucide-react';

interface CalibrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CalibrationData) => void;
  tempLine: { start: Point; end: Point } | null;
  currentCalibration: CalibrationData | null;
}

export const CalibrationDialog: React.FC<CalibrationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tempLine,
  currentCalibration,
}) => {
  const [knownLength, setKnownLength] = useState<string>('100');
  const [unit, setUnit] = useState<Unit>('mm');
  const [error, setError] = useState<string>('');

  const activePoints = tempLine || (currentCalibration ? { start: currentCalibration.start, end: currentCalibration.end } : null);
  const pixelLength = activePoints ? getDistance(activePoints.start, activePoints.end) : 0;

  useEffect(() => {
    if (isOpen) {
      if (currentCalibration && !tempLine) {
        setKnownLength(String(currentCalibration.knownLength));
        setUnit(currentCalibration.unit);
      } else if (unit === 'px') {
        setUnit('mm');
      }
      setError('');
    }
  }, [isOpen, currentCalibration, tempLine]);

  if (!isOpen || !activePoints) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(knownLength);
    if (isNaN(num) || num <= 0) {
      setError('请输入大于 0 的有效数字长度');
      return;
    }
    if (pixelLength <= 0) {
      setError('标定线像素长度不能为 0');
      return;
    }

    const pixelsPerUnit = pixelLength / num;
    const unitsPerPixel = num / pixelLength;

    onConfirm({
      start: activePoints.start,
      end: activePoints.end,
      knownLength: num,
      unit,
      pixelLength,
      pixelsPerUnit,
      unitsPerPixel,
    });
    onClose();
  };

  const numVal = parseFloat(knownLength);
  const isValidNum = !isNaN(numVal) && numVal > 0;
  const ratioPreview = isValidNum && pixelLength > 0
    ? (numVal / pixelLength).toFixed(4)
    : null;

  return (
    <div
      id="calibration-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        id="calibration-dialog-card"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">设置标定基准长度</h3>
              <p className="text-xs text-slate-500">根据已知物体长度设定像素与实际尺寸比例</p>
            </div>
          </div>
          <button
            id="close-calibration-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Measured pixel length indicator */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center justify-between text-sm">
            <span className="text-slate-600">所画线段像素距离：</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {pixelLength.toFixed(1)} px
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              此线段对应的实际长度
            </label>
            <div className="flex gap-2">
              <input
                id="known-length-input"
                type="number"
                step="any"
                min="0.0001"
                autoFocus
                value={knownLength}
                onChange={(e) => {
                  setKnownLength(e.target.value);
                  setError('');
                }}
                placeholder="例如: 25 或 100"
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-800 shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
              <select
                id="unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                {(Object.keys(UNIT_LABELS) as Unit[])
                  .filter((u) => u !== 'px')
                  .map((u) => (
                    <option key={u} value={u}>
                      {u} ({UNIT_LABELS[u].split(' ')[0]})
                    </option>
                  ))}
              </select>
            </div>
            {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
          </div>

          {/* Scale ratio preview */}
          {ratioPreview && (
            <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                <span>换算比例预览</span>
              </div>
              <p className="font-mono">
                1 像素 (px) ≈ <span className="font-bold">{ratioPreview}</span> {unit}
              </p>
              <p className="text-amber-700/80">
                1 {unit} ≈ {(pixelLength / numVal).toFixed(2)} 像素 (px)
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              id="cancel-calibration-button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              取消
            </button>
            <button
              type="submit"
              id="confirm-calibration-button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 active:bg-amber-800 transition"
            >
              <Check className="h-4 w-4" />
              确认标定比例
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
