import React from 'react';
import { X, Keyboard, MousePointer, Move, ZoomIn, Scissors, RotateCcw } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'Shift + 拖动',
      desc: '锁定正交方向（0°、45°、90°），适合画水平或竖直标准线',
      icon: <Scissors className="h-4 w-4 text-sky-500" />,
    },
    {
      key: '鼠标滚轮',
      desc: '以当前鼠标位置为中心进行平滑放大与缩小',
      icon: <ZoomIn className="h-4 w-4 text-emerald-500" />,
    },
    {
      key: '空格键 + 拖拽 / 鼠标中键',
      desc: '快捷平移浏览超大图片或细节区域',
      icon: <Move className="h-4 w-4 text-indigo-500" />,
    },
    {
      key: '方向键 (↑ ↓ ← →)',
      desc: '选中端点后，按上下左右可进行 1 像素高精度微调',
      icon: <Keyboard className="h-4 w-4 text-amber-500" />,
    },
    {
      key: 'Esc',
      desc: '放弃并取消当前正在绘制的线段',
      icon: <RotateCcw className="h-4 w-4 text-rose-500" />,
    },
    {
      key: 'Delete / Backspace',
      desc: '删除当前选中的测量对象',
      icon: <X className="h-4 w-4 text-slate-500" />,
    },
    {
      key: '双击 / Enter',
      desc: '结束多段折线 (Polyline) 的连续绘制',
      icon: <MousePointer className="h-4 w-4 text-blue-500" />,
    },
  ];

  return (
    <div
      id="shortcuts-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        id="shortcuts-modal-card"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">操作手势与快捷键</h3>
              <p className="text-xs text-slate-500">掌握高效测绘技巧，提升测量精度与操作流畅度</p>
            </div>
          </div>
          <button
            id="close-shortcuts-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100"
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-sm text-slate-600 font-medium">{item.desc}</span>
              </div>
              <kbd className="rounded-lg bg-white px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 shadow-xs border border-slate-200 shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            id="understood-shortcuts-btn"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
