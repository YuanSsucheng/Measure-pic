import React, { useRef } from 'react';
import {
  Upload,
  Ruler,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Download,
  HelpCircle,
  FolderOpen,
  MousePointer,
  Hand,
  Spline,
  Minus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ToolMode, CalibrationData } from '../types';
import { SAMPLE_IMAGES, SampleImage } from '../utils/sampleImages';

interface ToolbarProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  calibration: CalibrationData | null;
  onOpenCalibrationDialog: () => void;
  onUploadImage: (file: File) => void;
  onSelectSample: (sample: SampleImage) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitZoom: () => void;
  onRotate: () => void;
  loupeEnabled: boolean;
  onToggleLoupe: () => void;
  onExportImage: () => void;
  onOpenShortcuts: () => void;
  hasImage: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  calibration,
  onOpenCalibrationDialog,
  onUploadImage,
  onSelectSample,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitZoom,
  onRotate,
  loupeEnabled,
  onToggleLoupe,
  onExportImage,
  onOpenShortcuts,
  hasImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSamplesMenu, setShowSamplesMenu] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
      // reset so same file can be selected again if wanted
      e.target.value = '';
    }
  };

  return (
    <header
      id="main-toolbar"
      className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs select-none shrink-0 z-20"
    >
      {/* Left: App Logo & Image Import */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
            <Ruler className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 leading-tight">图片尺寸测绘仪</h1>
            <p className="text-[11px] text-slate-500">基准线标定 · 像素级测距</p>
          </div>
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/bmp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          id="upload-image-btn"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 transition"
          title="导入图片文件 (PNG, JPG, JPEG, WEBP, SVG等)"
        >
          <Upload className="h-4 w-4 text-slate-600" />
          <span>导入图片</span>
        </button>

        {/* Sample Images Dropdown */}
        <div className="relative">
          <button
            id="sample-images-menu-btn"
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition"
          >
            <FolderOpen className="h-4 w-4 text-sky-600" />
            <span>示例图</span>
          </button>

          {showSamplesMenu && (
            <div
              id="samples-dropdown"
              className="absolute left-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">选择快速测试样例</div>
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left rounded-xl p-2 hover:bg-slate-50 transition flex flex-col gap-0.5"
                >
                  <span className="text-xs font-semibold text-slate-800">{sample.name}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{sample.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Tools selector */}
      <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200">
        <button
          id="tool-select-btn"
          onClick={() => onSelectTool('select')}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
            currentTool === 'select'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
          }`}
          title="选择或微调端点"
        >
          <MousePointer className="h-3.5 w-3.5" />
          <span className="hidden md:inline">选择/调整</span>
        </button>

        {/* Calibrate Tool */}
        <button
          id="tool-calibrate-btn"
          onClick={() => onSelectTool('calibrate')}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
            currentTool === 'calibrate'
              ? 'bg-amber-500 text-white shadow-xs font-semibold'
              : calibration
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
          }`}
          title="画一条已知长度的基准线以完成标定"
        >
          <Ruler className="h-3.5 w-3.5" />
          <span>标定基准线</span>
          {calibration ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        {/* Straight Line Measure */}
        <button
          id="tool-line-btn"
          onClick={() => onSelectTool('line')}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
            currentTool === 'line'
              ? 'bg-sky-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
          }`}
          title="两点直线测距 (按住Shift锁定正交)"
        >
          <Minus className="h-3.5 w-3.5" />
          <span>测量直线</span>
        </button>

        {/* Polyline Measure */}
        <button
          id="tool-polyline-btn"
          onClick={() => onSelectTool('polyline')}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
            currentTool === 'polyline'
              ? 'bg-sky-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
          }`}
          title="多段折线累计测距 (双击结束)"
        >
          <Spline className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">连续折线</span>
        </button>

        {/* Pan Hand Tool */}
        <button
          id="tool-pan-btn"
          onClick={() => onSelectTool('pan')}
          disabled={!hasImage}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
            currentTool === 'pan'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
          }`}
          title="拖动画布平移 (快捷键: 空格 + 拖拽)"
        >
          <Hand className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">平移</span>
        </button>
      </div>

      {/* Right: Zoom & Export Utilities */}
      <div className="flex items-center gap-1.5">
        {/* Zoom group */}
        <div className="hidden lg:flex items-center rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
          <button
            id="zoom-out-btn"
            onClick={onZoomOut}
            disabled={!hasImage}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30"
            title="缩小"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            id="zoom-reset-btn"
            onClick={onResetZoom}
            disabled={!hasImage}
            className="px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-md transition"
            title="重置为 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="zoom-in-btn"
            onClick={onZoomIn}
            disabled={!hasImage}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30"
            title="放大"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-3 w-px bg-slate-200" />
          <button
            id="fit-zoom-btn"
            onClick={onFitZoom}
            disabled={!hasImage}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30"
            title="自适应缩放"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            id="rotate-btn"
            onClick={onRotate}
            disabled={!hasImage}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-30"
            title="顺时针旋转90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Loupe Toggle */}
        <button
          id="toggle-loupe-btn"
          onClick={onToggleLoupe}
          disabled={!hasImage}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-medium transition ${
            loupeEnabled
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
          } disabled:opacity-40`}
          title="开关像素放大镜"
        >
          <Search className="h-3.5 w-3.5 text-sky-600" />
          <span className="hidden xl:inline">放大镜</span>
        </button>

        {/* Export Annotated Image */}
        <button
          id="export-annotated-image-btn"
          onClick={onExportImage}
          disabled={!hasImage}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-semibold shadow-xs transition disabled:opacity-40"
          title="将测量标注结果合成导出为 PNG 高清图"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">导出标注图</span>
        </button>

        {/* Shortcuts Help */}
        <button
          id="open-shortcuts-help-btn"
          onClick={onOpenShortcuts}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="快捷键与使用技巧"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
