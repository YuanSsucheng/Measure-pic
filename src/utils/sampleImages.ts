// SVG-based high-resolution realistic sample images for immediate testing

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  defaultKnownLength: number;
  defaultUnit: 'mm' | 'cm' | 'm';
  defaultReferenceHint: string;
  src: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'mechanical-part',
    name: '机械加工零件图',
    description: '包含直径 25mm 的标准校准硬币与机械支架轮廓，用于测量孔径与边长',
    defaultKnownLength: 25,
    defaultUnit: 'mm',
    defaultReferenceHint: '右下角圆形硬币直径 (25 mm)',
    src: createMechanicalSampleSvg(),
  },
  {
    id: 'floor-plan',
    name: '室内户型平面图',
    description: '现代住宅平面布局图，包含标准入户门（宽 1000mm）与已知房间尺寸',
    defaultKnownLength: 1000,
    defaultUnit: 'mm',
    defaultReferenceHint: '入户防盗门开口宽度 (1000 mm)',
    src: createFloorPlanSampleSvg(),
  },
  {
    id: 'circuit-board',
    name: '电子元器件 PCB',
    description: '标准双层电路板，包含 2.54mm 标准排针间距与 16 脚集成芯片',
    defaultKnownLength: 20,
    defaultUnit: 'mm',
    defaultReferenceHint: '主控芯片长边封装尺寸 (20 mm)',
    src: createPcbSampleSvg(),
  },
];

function createMechanicalSampleSvg(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="mech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/>
    </pattern>
    <radialGradient id="metal-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="60%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </radialGradient>
    <linearGradient id="coin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#000000" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Background Blueprint Table -->
  <rect width="1200" height="800" fill="#f8fafc" />
  <rect width="1200" height="800" fill="url(#mech-grid)" />

  <!-- Drawing Border & Title Block -->
  <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#64748b" stroke-width="2" />
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4" />
  
  <!-- Info Block -->
  <g transform="translate(60, 60)">
    <text font-family="sans-serif" font-size="20" font-weight="700" fill="#1e293b">CNC 铝合金连杆零件测绘样例</text>
    <text y="26" font-family="sans-serif" font-size="13" fill="#64748b">标准测试样本 · 提示：先测量右侧校准硬币直径作为基准线，然后测量零件各尺寸</text>
  </g>

  <!-- Main Mechanical Part -->
  <g transform="translate(180, 200)" filter="url(#shadow)">
    <!-- Base Plate -->
    <path d="M 60 160 
             L 520 160 
             A 60 60 0 0 0 580 100 
             L 580 60 
             A 60 60 0 0 0 520 0 
             L 60 0 
             A 60 60 0 0 0 0 60 
             L 0 100 
             A 60 60 0 0 0 60 160 Z" 
          fill="url(#metal-grad)" stroke="#475569" stroke-width="2.5" />
    
    <!-- Chamfers and Inner pockets -->
    <rect x="140" y="30" width="300" height="100" rx="16" fill="#cbd5e1" stroke="#64748b" stroke-width="2" />

    <!-- Center bore holes -->
    <circle cx="60" cy="80" r="32" fill="#94a3b8" stroke="#334155" stroke-width="2" />
    <circle cx="520" cy="80" r="32" fill="#94a3b8" stroke="#334155" stroke-width="2" />
    
    <!-- Crosshairs on holes -->
    <line x1="15" y1="80" x2="105" y2="80" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="60" y1="35" x2="60" y2="125" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3"/>

    <line x1="475" y1="80" x2="565" y2="80" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="520" y1="35" x2="520" y2="125" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3"/>

    <!-- 4 Small mounting holes -->
    <circle cx="200" cy="80" r="10" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <circle cx="260" cy="80" r="10" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <circle cx="320" cy="80" r="10" fill="#64748b" stroke="#334155" stroke-width="1.5" />
    <circle cx="380" cy="80" r="10" fill="#64748b" stroke="#334155" stroke-width="1.5" />

    <!-- Flange Stiffener -->
    <path d="M 100 230 L 480 230 L 440 180 L 140 180 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
  </g>

  <!-- Standard Calibration Reference Coin (Diameter = 25.0 mm) -->
  <g transform="translate(920, 360)" filter="url(#shadow)">
    <circle cx="90" cy="90" r="90" fill="url(#coin-grad)" stroke="#a16207" stroke-width="3" />
    <circle cx="90" cy="90" r="82" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="4 2" />
    <circle cx="90" cy="90" r="68" fill="#fef9c3" stroke="#eab308" stroke-width="1" />
    
    <text x="90" y="78" font-family="sans-serif" font-size="22" font-weight="bold" fill="#854d0e" text-anchor="middle">基准参考物</text>
    <text x="90" y="105" font-family="sans-serif" font-size="28" font-weight="900" fill="#713f12" text-anchor="middle">⌀ 25.0</text>
    <text x="90" y="125" font-family="sans-serif" font-size="14" font-weight="600" fill="#854d0e" text-anchor="middle">MILLIMETERS</text>
    
    <!-- Two reference tick marks for diameter -->
    <line x1="0" y1="90" x2="180" y2="90" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4" />
    <circle cx="0" cy="90" r="4" fill="#dc2626" />
    <circle cx="180" cy="90" r="4" fill="#dc2626" />
    <text x="90" y="156" font-family="sans-serif" font-size="12" fill="#713f12" text-anchor="middle">← 两端点距离 = 25mm →</text>
  </g>

  <!-- Extra small metal rod for testing -->
  <g transform="translate(200, 560)" filter="url(#shadow)">
    <rect width="360" height="28" rx="6" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
    <line x1="60" y1="0" x2="60" y2="28" stroke="#94a3b8" stroke-width="1.5" />
    <line x1="180" y1="0" x2="180" y2="28" stroke="#94a3b8" stroke-width="1.5" />
    <line x1="300" y1="0" x2="300" y2="28" stroke="#94a3b8" stroke-width="1.5" />
    <text x="180" y="-8" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">测试工件：定位销轴</text>
  </g>
</svg>
`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function createFloorPlanSampleSvg(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="cad-grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" stroke-width="0.8"/>
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="800" fill="#ffffff" />
  <rect width="1200" height="800" fill="url(#cad-grid)" />

  <text x="60" y="60" font-family="sans-serif" font-size="22" font-weight="700" fill="#0f172a">建筑户型平面测绘图 (Architectural Plan)</text>
  <text x="60" y="86" font-family="sans-serif" font-size="14" fill="#64748b">标定建议：使用入口入户门宽度作为已知基准线（门宽标称 1000 mm）</text>

  <!-- Floor Plan Container -->
  <g transform="translate(160, 140)">
    <!-- Outer Walls (Thickness: 16) -->
    <path d="M 0 0 L 700 0 L 700 520 L 0 520 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="12" stroke-linejoin="round" />

    <!-- Interior Walls -->
    <!-- Bedroom 1 Divider -->
    <line x1="380" y1="0" x2="380" y2="300" stroke="#1e293b" stroke-width="10" />
    <!-- Bathroom Divider -->
    <line x1="380" y1="300" x2="700" y2="300" stroke="#1e293b" stroke-width="10" />
    <line x1="520" y1="300" x2="520" y2="520" stroke="#1e293b" stroke-width="10" />
    <!-- Kitchen Divider -->
    <line x1="0" y1="260" x2="220" y2="260" stroke="#1e293b" stroke-width="10" />

    <!-- Room Labels -->
    <text x="180" y="140" font-family="sans-serif" font-size="18" font-weight="600" fill="#334155" text-anchor="middle">客厅 (Living Room)</text>
    <text x="540" y="150" font-family="sans-serif" font-size="18" font-weight="600" fill="#334155" text-anchor="middle">主卧 (Master Bedroom)</text>
    <text x="110" y="380" font-family="sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">厨房 (Kitchen)</text>
    <text x="450" y="420" font-family="sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">卫浴 (Bathroom)</text>
    <text x="610" y="420" font-family="sans-serif" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">阳台 (Balcony)</text>

    <!-- Entrance Door with swing arc (Width: 100) -> 1000mm standard -->
    <g transform="translate(0, 80)">
      <rect x="-6" y="0" width="12" height="100" fill="#ffffff" />
      <line x1="0" y1="0" x2="70" y2="-70" stroke="#0284c7" stroke-width="3" />
      <path d="M 0 100 A 100 100 0 0 1 70 -70" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3 3" />
      
      <!-- Door Width Marker Annotation -->
      <line x1="-30" y1="0" x2="-30" y2="100" stroke="#0284c7" stroke-width="1.5" />
      <line x1="-35" y1="0" x2="-25" y2="0" stroke="#0284c7" stroke-width="1.5" />
      <line x1="-35" y1="100" x2="-25" y2="100" stroke="#0284c7" stroke-width="1.5" />
      <text x="-40" y="55" font-family="sans-serif" font-size="13" font-weight="700" fill="#0284c7" text-anchor="end">入户门: 1000 mm</text>
    </g>

    <!-- Master Bedroom Door -->
    <g transform="translate(380, 220)">
      <rect x="-6" y="0" width="12" height="75" fill="#ffffff" />
      <path d="M 0 75 A 75 75 0 0 1 53 22" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3 3" />
    </g>

    <!-- Windows -->
    <rect x="700" y="100" width="8" height="140" fill="#38bdf8" stroke="#0284c7" stroke-width="1" />
    <rect x="240" y="516" width="160" height="8" fill="#38bdf8" stroke="#0284c7" stroke-width="1" />

    <!-- Sofa Furniture representation -->
    <rect x="60" y="30" width="220" height="70" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
    <!-- Bed representation -->
    <rect x="440" y="40" width="200" height="180" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
    <rect x="470" y="50" width="60" height="40" rx="4" fill="#cbd5e1" />
    <rect x="550" y="50" width="60" height="40" rx="4" fill="#cbd5e1" />
  </g>
</svg>
`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function createPcbSampleSvg(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="pcb-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="#14532d" opacity="0.6"/>
    </pattern>
  </defs>

  <rect width="1200" height="800" fill="#022c22" />
  <rect width="1200" height="800" fill="url(#pcb-pattern)" />

  <text x="60" y="60" font-family="monospace" font-size="20" font-weight="700" fill="#4ade80">SMD HARDWARE PCB REVISION 2.4</text>
  <text x="60" y="86" font-family="sans-serif" font-size="14" fill="#86efac">标定建议：中间微处理器芯片（MCU QFP-64）外沿封装长为 20.0 mm</text>

  <!-- Main Board Area -->
  <g transform="translate(180, 140)">
    <!-- PCB Board Outline -->
    <rect x="0" y="0" width="840" height="520" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="4" />

    <!-- Mounting Holes at 4 corners -->
    <circle cx="30" cy="30" r="16" fill="#022c22" stroke="#d97706" stroke-width="3" />
    <circle cx="810" cy="30" r="16" fill="#022c22" stroke="#d97706" stroke-width="3" />
    <circle cx="30" cy="490" r="16" fill="#022c22" stroke="#d97706" stroke-width="3" />
    <circle cx="810" cy="490" r="16" fill="#022c22" stroke="#d97706" stroke-width="3" />

    <!-- Copper Traces -->
    <path d="M 120 180 L 260 180 L 320 240 L 370 240" fill="none" stroke="#059669" stroke-width="3" />
    <path d="M 120 200 L 250 200 L 310 260 L 370 260" fill="none" stroke="#059669" stroke-width="3" />
    <path d="M 530 250 L 620 250 L 680 180 L 740 180" fill="none" stroke="#059669" stroke-width="3" />

    <!-- Main MCU Chip (20mm reference) -->
    <g transform="translate(370, 200)">
      <rect x="0" y="0" width="160" height="160" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
      <circle cx="20" cy="20" r="4" fill="#71717a" />
      <text x="80" y="75" font-family="monospace" font-size="16" font-weight="bold" fill="#e4e4e7" text-anchor="middle">STM32F405</text>
      <text x="80" y="100" font-family="monospace" font-size="12" fill="#a1a1aa" text-anchor="middle">ARM CORTEX-M4</text>
      <text x="80" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle">基准边长: 20 mm</text>

      <!-- Pins around the chip -->
      <!-- Top pins -->
      <g fill="#e2e8f0">
        <rect x="20" y="-12" width="6" height="12" />
        <rect x="36" y="-12" width="6" height="12" />
        <rect x="52" y="-12" width="6" height="12" />
        <rect x="68" y="-12" width="6" height="12" />
        <rect x="84" y="-12" width="6" height="12" />
        <rect x="100" y="-12" width="6" height="12" />
        <rect x="116" y="-12" width="6" height="12" />
        <rect x="132" y="-12" width="6" height="12" />
        <!-- Bottom pins -->
        <rect x="20" y="160" width="6" height="12" />
        <rect x="36" y="160" width="6" height="12" />
        <rect x="52" y="160" width="6" height="12" />
        <rect x="68" y="160" width="6" height="12" />
        <rect x="84" y="160" width="6" height="12" />
        <rect x="100" y="160" width="6" height="12" />
        <rect x="116" y="160" width="6" height="12" />
        <rect x="132" y="160" width="6" height="12" />
      </g>
    </g>

    <!-- USB-C Port -->
    <rect x="-10" y="220" width="40" height="80" rx="4" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2" />
    <text x="50" y="265" font-family="monospace" font-size="12" fill="#86efac">USB-C</text>

    <!-- Pin Headers (2.54mm pitch) -->
    <g transform="translate(100, 60)">
      <rect x="0" y="0" width="160" height="24" rx="2" fill="#18181b" />
      <circle cx="16" cy="12" r="4" fill="#eab308" />
      <circle cx="36" cy="12" r="4" fill="#eab308" />
      <circle cx="56" cy="12" r="4" fill="#eab308" />
      <circle cx="76" cy="12" r="4" fill="#eab308" />
      <circle cx="96" cy="12" r="4" fill="#eab308" />
      <circle cx="116" cy="12" r="4" fill="#eab308" />
      <circle cx="136" cy="12" r="4" fill="#eab308" />
    </g>
  </g>
</svg>
`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
