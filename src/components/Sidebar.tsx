import React, { useState } from 'react';
import {
  Ruler,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calculator,
  Sliders,
  Sparkles,
  ChevronRight,
  ListFilter,
  FileSpreadsheet,
} from 'lucide-react';
import { CalibrationData, Measurement, Unit } from '../types';
import { UNIT_LABELS } from '../utils/geometry';

interface SidebarProps {
  calibration: CalibrationData | null;
  measurements: Measurement[];
  selectedMeasurementId: string | null;
  onSelectMeasurement: (id: string | null) => void;
  onDeleteMeasurement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onClearMeasurements: () => void;
  onStartCalibration: () => void;
  onEditCalibration: () => void;
  onDeleteCalibration: () => void;
  onExportAnnotatedImage: () => void;
}

const PRESET_COLORS = [
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export const Sidebar: React.FC<SidebarProps> = ({
  calibration,
  measurements,
  selectedMeasurementId,
  onSelectMeasurement,
  onDeleteMeasurement,
  onToggleVisibility,
  onUpdateLabel,
  onUpdateColor,
  onClearMeasurements,
  onStartCalibration,
  onEditCalibration,
  onDeleteCalibration,
  onExportAnnotatedImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  // Stats calculation
  const validMeasurements = measurements.filter((m) => m.realDistance !== null);
  const totalReal = validMeasurements.reduce((acc, m) => acc + (m.realDistance || 0), 0);
  const avgReal = validMeasurements.length > 0 ? totalReal / validMeasurements.length : 0;
  const totalPx = measurements.reduce((acc, m) => acc + m.pixelDistance, 0);

  const handleCopyTable = () => {
    if (measurements.length === 0) return;
    const header = '序号\t标签\t实际测量长度\t单位\t像素长度 (px)\t类型\n';
    const rows = measurements
      .map((m, idx) => {
        const real = m.realDistance !== null ? m.realDistance : '-';
        const unit = m.unit || '-';
        return `${idx + 1}\t${m.label}\t${real}\t${unit}\t${m.pixelDistance.toFixed(1)}\t${m.type === 'line' ? '直线' : '折线'}`;
      })
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = (m: Measurement) => {
    setEditingId(m.id);
    setLabelDraft(m.label);
  };

  const handleSaveEdit = (id: string) => {
    if (labelDraft.trim()) {
      onUpdateLabel(id, labelDraft.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      id="measurements-sidebar"
      className="flex h-full w-80 lg:w-96 flex-col border-l border-slate-200 bg-slate-50/80 shadow-xs select-none shrink-0"
    >
      {/* 1. Calibration Status Banner / Card */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">基准比例标定</h2>
          </div>
          {calibration && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="h-3 w-3" />
              已生效
            </span>
          )}
        </div>

        {calibration ? (
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-sm">
                  基准长度: <span className="font-mono text-amber-700">{calibration.knownLength} {calibration.unit}</span>
                </div>
                <div className="mt-1 text-slate-500 font-mono text-[11px] space-y-0.5">
                  <p>标定像素: {calibration.pixelLength.toFixed(1)} px</p>
                  <p>换算率: 1 px ≈ {calibration.unitsPerPixel.toFixed(4)} {calibration.unit}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-amber-200/60">
              <button
                id="edit-calibration-btn"
                onClick={onEditCalibration}
                className="flex-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-amber-50 hover:text-amber-800 border border-amber-200 transition text-center"
              >
                修改数值
              </button>
              <button
                id="recalibrate-btn"
                onClick={onStartCalibration}
                className="flex-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition text-center"
              >
                重新画线标定
              </button>
              <button
                id="delete-calibration-btn"
                onClick={onDeleteCalibration}
                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="清除标定数据"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">尚未建立比例基准</p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  目前所有测量线仅显示像素 (px) 长度。在图中找一段已知长度的物体画基准线，即可换算出实际尺寸！
                </p>
              </div>
            </div>
            <button
              id="sidebar-start-calibrate-btn"
              onClick={onStartCalibration}
              className="mt-3 w-full rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition text-center"
            >
              立即绘制已知基准线
            </button>
          </div>
        )}
      </div>

      {/* 2. Measurements List Section */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1.5">
          <ListFilter className="h-4 w-4 text-slate-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">测量记录</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {measurements.length}
          </span>
        </div>

        {measurements.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              id="copy-measurements-btn"
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="复制测量数据到剪贴板 (Excel可直接粘贴)"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? '已复制' : '复制数据'}</span>
            </button>
            <button
              id="clear-all-measurements-btn"
              onClick={onClearMeasurements}
              className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="清空所有测量"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Measurement Items container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {measurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="rounded-full bg-slate-200/60 p-3 text-slate-400 mb-2">
              <Calculator className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700">暂无测量记录</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              选择上方【测量直线】或【连续折线】工具，在图片上点击两点开始测量
            </p>
          </div>
        ) : (
          measurements.map((m, idx) => {
            const isSelected = selectedMeasurementId === m.id;
            const isEditing = editingId === m.id;

            return (
              <div
                key={m.id}
                id={`measurement-card-${m.id}`}
                onClick={() => onSelectMeasurement(m.id)}
                className={`group relative rounded-xl border p-3 transition cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/40 shadow-xs ring-1 ring-sky-500/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
                } ${!m.visible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Color dot / picker */}
                    <div className="relative shrink-0">
                      <span
                        className="block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-xs"
                        style={{ backgroundColor: m.color }}
                      />
                    </div>

                    {/* Label or Inline Edit */}
                    {isEditing ? (
                      <input
                        id={`edit-label-input-${m.id}`}
                        type="text"
                        autoFocus
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onBlur={() => handleSaveEdit(m.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(m.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full rounded-md border border-sky-400 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => handleStartEdit(m)}
                        className="truncate text-xs font-semibold text-slate-800 hover:text-sky-700 cursor-text"
                        title="双击可重命名标签"
                      >
                        {m.label || `测量 #${idx + 1}`}
                      </span>
                    )}
                  </div>

                  {/* Actions: Visibility, Delete */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      id={`toggle-vis-${m.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(m.id);
                      }}
                      className="rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title={m.visible ? '隐藏此线' : '显示此线'}
                    >
                      {m.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                    <button
                      id={`delete-meas-${m.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeasurement(m.id);
                      }}
                      className="rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="删除此测量"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Values row */}
                <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
                  <div>
                    {m.realDistance !== null && m.unit ? (
                      <div className="font-mono text-base font-bold text-slate-900 leading-none">
                        {m.realDistance} <span className="text-xs font-semibold text-slate-500">{m.unit}</span>
                      </div>
                    ) : (
                      <div className="font-mono text-sm font-semibold text-amber-600 leading-none">
                        未标定基准
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {m.pixelDistance.toFixed(1)} px
                  </div>
                </div>

                {/* Color swatches palette on active card */}
                {isSelected && (
                  <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-sky-100">
                    <span className="text-[10px] text-slate-400 mr-1">线条色彩:</span>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateColor(m.id, c);
                        }}
                        className={`h-4 w-4 rounded-full transition transform hover:scale-125 ${
                          m.color === c ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Summary & Quick Stats */}
      {measurements.length > 0 && (
        <div className="border-t border-slate-200 bg-white p-3.5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>测量统计汇总</span>
            <span className="text-slate-500 font-normal">{measurements.length} 处测量</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">累计总距离</span>
              <span className="font-bold text-slate-800 text-xs">
                {calibration && validMeasurements.length > 0
                  ? `${totalReal.toFixed(2)} ${calibration.unit}`
                  : `${totalPx.toFixed(1)} px`}
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">平均测量值</span>
              <span className="font-bold text-slate-800 text-xs">
                {calibration && validMeasurements.length > 0
                  ? `${avgReal.toFixed(2)} ${calibration.unit}`
                  : `${(totalPx / measurements.length).toFixed(1)} px`}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
