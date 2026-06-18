// Tool icon definitions — unique app-icon style icons for all 170+ tools
// Each tool: gradient background + unique white foreground symbol

export interface IconDef {
  bg: [string, string]; // gradient start/end
  fg: string;           // SVG foreground markup (white, inside viewBox 0 0 48 48)
}

// Category color palettes (16 distinct gradients)
const C: Record<string, [string, string]> = {
  encoding:    ['#3b82f6', '#1d4ed8'],
  encryption:  ['#6366f1', '#3730a3'],
  hashing:     ['#8b5cf6', '#6d28d9'],
  text:        ['#14b8a6', '#0f766e'],
  regex:       ['#ec4899', '#be185d'],
  'data-format': ['#f59e0b', '#b45309'],
  network:     ['#0ea5e9', '#0369a1'],
  security:    ['#ef4444', '#b91c1c'],
  converter:   ['#10b981', '#047857'],
  image:       ['#f97316', '#c2410c'],
  css:         ['#a855f7', '#7e22ce'],
  javascript:  ['#eab308', '#a16207'],
  generator:   ['#84cc16', '#4d7c0f'],
  math:        ['#06b6d4', '#0e7490'],
  document:    ['#f43f5e', '#be123c'],
  analysis:    ['#22c55e', '#15803d'],
};

// ── Foreground symbol library ──
// Each symbol is SVG markup (white fill/stroke) that fits inside a centered area
// Designed for 48x48 viewBox, centered around (24,24)

const S: Record<string, string> = {
  // ── General / Text ──
  'arrow-left-right': `<path d="M12 18l-6-6 6-6M16 12H6M36 18l6-6-6-6M32 12h10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'arrow-down': `<path d="M24 10v20M18 24l6 6 6-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'arrow-up': `<path d="M24 38V18M18 24l6-6 6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'arrow-right': `<path d="M12 24h20M26 18l6 6-6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'arrow-left': `<path d="M36 24H16M22 18l-6 6 6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'arrow-cycle': `<path d="M32 24a8 8 0 00-11-7M14 13l3 4-4 4M16 24a8 8 0 0011 7M34 35l-3-4 4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'lock': `<rect x="10" y="20" width="28" height="20" rx="3" fill="none" stroke="white" stroke-width="2.5"/><path d="M16 20v-6a8 8 0 0116 0v6" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="24" cy="30" r="3" fill="white"/>`,
  'key': `<circle cx="16" cy="28" r="5" fill="none" stroke="white" stroke-width="2.5"/><path d="M20 28h14l3 3-3 3-3-3-3 3" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'shield': `<path d="M24 38s12-6 12-15V12l-12-4-12 4v11c0 9 12 15 12 15z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>`,
  'shield-check': `<path d="M24 38s12-6 12-15V12l-12-4-12 4v11c0 9 12 15 12 15z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 24l4 4 8-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'shield-alert': `<path d="M24 38s12-6 12-15V12l-12-4-12 4v11c0 9 12 15 12 15z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><line x1="24" y1="20" x2="24" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="32" r="1.5" fill="white"/>`,
  'hash': `<line x1="15" y1="10" x2="15" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="33" y1="10" x2="33" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="18" x2="39" y2="18" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="30" x2="39" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'fingerprint': `<path d="M16 15a8 8 0 0116 0c0 4-2 8-4 12M14 27a10 10 0 0120 0M12 32a12 12 0 0124 0c0 2-1 4-2 6" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'text-T': `<path d="M24 10v28M14 10h20" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'text-cursor': `<path d="M18 12h4M18 16h8M18 20h6" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><line x1="14" y1="10" x2="14" y2="36" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="33" y1="10" x2="33" y2="32" stroke="white" stroke-width="3" stroke-linecap="round"/>`,
  'braces': `<path d="M16 12C13 12 13 15 13 18v3c0 3-2 4-3 5 1 1 3 2 3 5v3c0 3 0 6 3 6M32 12c3 0 3 3 3 6v3c0 3 2 4 3 5-1 1-3 2-3 5v3c0 3 0 6-3 6" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'brackets': `<path d="M12 10v28M14 10l-4 4M14 38l-4-4M36 10v28M34 10l4 4M34 38l4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'search': `<circle cx="22" cy="22" r="8" stroke="white" stroke-width="2.5" fill="none"/><line x1="28" y1="28" x2="35" y2="35" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'globe': `<circle cx="24" cy="24" r="11" stroke="white" stroke-width="2.5" fill="none"/><ellipse cx="24" cy="24" rx="11" ry="4" stroke="white" stroke-width="2.5" fill="none"/><line x1="24" y1="13" x2="24" y2="35" stroke="white" stroke-width="2.5"/><path d="M14 20h20M14 28h20" stroke="white" stroke-width="1.5" opacity="0.5" fill="none"/>`,
  'wifi': `<path d="M14 20a14 14 0 0120 0M18 25a8 8 0 0112 0M22 30a3 3 0 016 0" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="25" cy="35" r="2" fill="white"/>`,
  'link': `<path d="M18 20l12-12M32 14l4 4-10 10-4-4zM16 28l-4-4 10-10 4 4z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'code-brackets': `<path d="M18 18l-6 6 6 6M30 18l6 6-6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'code-slash': `<path d="M20 18l-6 6 6 6M28 14l-4 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'terminal': `<rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="white" stroke-width="2.5"/><path d="M14 20l4 4-4 4M22 28h10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'file-text': `<path d="M12 10h24v28a3 3 0 01-3 3H15a3 3 0 01-3-3V10z" fill="none" stroke="white" stroke-width="2.5"/><path d="M12 10l6-5h15a3 3 0 013 3v2" fill="none" stroke="white" stroke-width="2.5"/><line x1="18" y1="22" x2="30" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="27" x2="27" y2="27" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="32" x2="24" y2="32" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  'file-code': `<path d="M12 10h24v28a3 3 0 01-3 3H15a3 3 0 01-3-3V10z" fill="none" stroke="white" stroke-width="2.5"/><path d="M12 10l6-5h15a3 3 0 013 3v2" fill="none" stroke="white" stroke-width="2.5"/><path d="M19 22l3 4-3 4M25 20l3 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'mail': `<rect x="8" y="14" width="32" height="22" rx="3" fill="none" stroke="white" stroke-width="2.5"/><path d="M8 16l16 10 16-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'book': `<path d="M8 10h14l4 4v24a2 2 0 01-2 2H10a2 2 0 01-2-2V10z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 10v4h4" stroke="white" stroke-width="2.5" fill="none"/><line x1="14" y1="24" x2="24" y2="24" stroke="white" stroke-width="2"/><line x1="14" y1="29" x2="24" y2="29" stroke="white" stroke-width="2"/>`,
  'eye': `<path d="M24 16c-7 0-12 7-12 8s5 8 12 8 12-7 12-8-5-8-12-8z" fill="none" stroke="white" stroke-width="2.5"/><circle cx="24" cy="24" r="3" fill="white"/>`,
  'eye-off': `<path d="M24 16c-7 0-12 7-12 8s5 8 12 8 12-7 12-8-5-8-12-8z" fill="none" stroke="white" stroke-width="2.5"/><line x1="16" y1="16" x2="32" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'qr': `<rect x="12" y="12" width="8" height="8" rx="1" fill="white"/><rect x="28" y="12" width="8" height="8" rx="1" fill="white"/><rect x="12" y="28" width="8" height="8" rx="1" fill="white"/><rect x="28" y="28" width="4" height="4" rx="0.5" fill="white"/><rect x="34" y="22" width="4" height="4" rx="0.5" fill="white"/><rect x="22" y="34" width="4" height="4" rx="0.5" fill="white"/><rect x="28" y="35" width="8" height="2" rx="1" fill="white"/>`,
  'barcode': `<rect x="10" y="14" width="3" height="20" rx="0.5" fill="white"/><rect x="15" y="14" width="2" height="20" rx="0.5" fill="white"/><rect x="19" y="14" width="4" height="20" rx="0.5" fill="white"/><rect x="25" y="14" width="2" height="20" rx="0.5" fill="white"/><rect x="29" y="14" width="3" height="20" rx="0.5" fill="white"/><rect x="34" y="14" width="4" height="20" rx="0.5" fill="white"/>`,
  'image-landscape': `<rect x="6" y="10" width="36" height="28" rx="3" fill="none" stroke="white" stroke-width="2.5"/><circle cx="34" cy="16" r="2.5" fill="white"/><path d="M6 30l8-8 6 6 8-12 8 14" stroke="white" stroke-width="2.5" stroke-linejoin="round" fill="none"/>`,
  'palette': `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><path d="M22 16a12 12 0 00-8.5 3.5A12 12 0 0035 24c0-4.5-5-8-10-8-1 0-3 .5-3 2s2 2 3 2h1.5c2 0 3.5.5 3.5 2.5s-2 3-4.5 3" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'calculator': `<rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="white" stroke-width="2.5"/><line x1="8" y1="18" x2="40" y2="18" stroke="white" stroke-width="2.5"/><circle cx="16" cy="25" r="2" fill="white"/><circle cx="24" cy="25" r="2" fill="white"/><circle cx="32" cy="25" r="2" fill="white"/><rect x="12" y="31" width="20" height="4" rx="2" fill="white"/>`,
  'clock': `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><polyline points="24,14 24,24 30,28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'calendar': `<rect x="7" y="10" width="34" height="30" rx="3" fill="none" stroke="white" stroke-width="2.5"/><line x1="7" y1="20" x2="41" y2="20" stroke="white" stroke-width="2.5"/><line x1="16" y1="6" x2="16" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="6" x2="32" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'bar-chart': `<line x1="8" y1="36" x2="40" y2="36" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="36" x2="8" y2="10" stroke="white" stroke-width="2.5" stroke-linecap="round"/><rect x="12" y="18" width="5" height="18" rx="1" fill="white" opacity="0.85"/><rect x="21" y="10" width="5" height="26" rx="1" fill="white"/><rect x="30" y="24" width="5" height="12" rx="1" fill="white" opacity="0.85"/>`,
  'binary': `<text x="24" y="32" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="white">01</text>`,
  'check': `<path d="M14 24l6 6 14-14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'plus': `<line x1="24" y1="14" x2="24" y2="34" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="24" x2="34" y2="24" stroke="white" stroke-width="3" stroke-linecap="round"/>`,
  'star': `<path d="M24 10l3 9h9l-7 6 3 9-8-5-8 5 3-9-7-6h9z" fill="white"/>`,
  'sparkle': `<path d="M24 8l1 5h5l-4 3 1.5 5-3.5-2.5-3.5 2.5L22 16l-4-3h5z" fill="white"/><circle cx="16" cy="38" r="1.5" fill="white" opacity="0.6"/><circle cx="34" cy="36" r="1" fill="white" opacity="0.5"/>`,
  'gear': `<circle cx="24" cy="24" r="7" fill="none" stroke="white" stroke-width="2.5"/><path d="M24 14v-3M30 15.5l2-2.5M33 21h3M31.5 28l2.5 2M28 32v3M20 33l-2.5 2M15 28h-3M16 20l-2.5-2" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'wand': `<line x1="18" y1="30" x2="34" y2="14" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="34" y1="14" x2="38" y2="10" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="1.5" fill="white"/><circle cx="30" cy="18" r="1" fill="white" opacity="0.6"/><circle cx="20" cy="28" r="1" fill="white" opacity="0.6"/>`,
  'droplet': `<path d="M24 8C16 18 12 23 12 29a12 12 0 0024 0c0-6-4-11-12-21z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>`,
  'scissors': `<circle cx="14" cy="16" r="5" fill="none" stroke="white" stroke-width="2.5"/><circle cx="14" cy="32" r="5" fill="none" stroke="white" stroke-width="2.5"/><line x1="18" y1="16" x2="32" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="32" x2="32" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="24" r="1.5" fill="white"/>`,
  'crop': `<path d="M14 12v20a2 2 0 002 2h20M14 20h14a2 2 0 002-2V6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="8" y1="8" x2="8" y2="40" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="40" x2="40" y2="40" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'minimize': `<polyline points="12,24 24,36 36,24" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="8" y1="12" x2="40" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'maximize': `<polyline points="12,24 24,12 36,24" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="8" y1="36" x2="40" y2="36" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'expand': `<path d="M28 10h10v10M20 38H10V28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'layers': `<rect x="10" y="10" width="28" height="28" rx="3" fill="none" stroke="white" stroke-width="2.5"/><rect x="14" y="15" width="28" height="28" rx="3" fill="none" stroke="white" stroke-width="2.5" opacity="0.4"/>`,
  'grid': `<rect x="10" y="10" width="10" height="10" rx="2" fill="white"/><rect x="28" y="10" width="10" height="10" rx="2" fill="white" opacity="0.5"/><rect x="10" y="28" width="10" height="10" rx="2" fill="white" opacity="0.5"/><rect x="28" y="28" width="10" height="10" rx="2" fill="white" opacity="0.8"/>`,
  'smartphone': `<rect x="14" y="6" width="20" height="36" rx="4" fill="none" stroke="white" stroke-width="2.5"/><line x1="18" y1="10" x2="30" y2="10" stroke="white" stroke-width="2"/><circle cx="24" cy="34" r="2" fill="white"/>`,
  'play': `<polygon points="18,12 34,24 18,36" fill="white" stroke="none"/>`,
  'activity': `<polyline points="8,30 14,30 18,16 24,34 28,20 34,20 40,20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'database': `<ellipse cx="24" cy="12" rx="14" ry="4" fill="none" stroke="white" stroke-width="2.5"/><path d="M10 12v24c0 2.2 6.3 4 14 4s14-1.8 14-4V12" fill="none" stroke="white" stroke-width="2.5"/><path d="M10 20c0 2.2 6.3 4 14 4s14-1.8 14-4M10 28c0 2.2 6.3 4 14 4s14-1.8 14-4" stroke="white" stroke-width="2" opacity="0.45" fill="none"/>`,
  'radio': `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><path d="M24 14v10M18 24h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="24" r="3" fill="white"/>`,
  'bug': `<path d="M16 14a8 8 0 0116 0v8a8 8 0 01-16 0V14z" fill="none" stroke="white" stroke-width="2.5"/><line x1="8" y1="10" x2="16" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="10" x2="32" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="22" x2="34" y2="22" stroke="white" stroke-width="2"/><line x1="14" y1="28" x2="34" y2="28" stroke="white" stroke-width="2"/><line x1="24" y1="28" x2="24" y2="36" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'map-pin': `<path d="M24 10c-6 0-10 4.5-10 10 0 8 10 20 10 20s10-12 10-20c0-5.5-4-10-10-10z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="20" r="3" fill="white"/>`,
  'award': `<circle cx="24" cy="16" r="8" fill="none" stroke="white" stroke-width="2.5"/><path d="M18 22l-4 12 10-6 10 6-4-12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  'upload': `<path d="M24 14v22M18 20l6-6 6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="10" y1="38" x2="38" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,
  'toggle': `<rect x="8" y="16" width="32" height="16" rx="8" fill="none" stroke="white" stroke-width="2.5"/><circle cx="16" cy="24" r="5" fill="white"/>`,
  'alert-triangle': `<path d="M24 12L8 38h32z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><line x1="24" y1="22" x2="24" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="34" r="1.5" fill="white"/>`,
  'percent': `<line x1="10" y1="10" x2="38" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="14" cy="14" r="3" fill="none" stroke="white" stroke-width="2.5"/><circle cx="34" cy="34" r="3" fill="none" stroke="white" stroke-width="2.5"/>`,
  'list': `<line x1="14" y1="14" x2="34" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="24" x2="34" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="34" x2="24" y2="34" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="10" cy="14" r="1.5" fill="white"/><circle cx="10" cy="24" r="1.5" fill="white"/><circle cx="10" cy="34" r="1.5" fill="white"/>`,
  'table': `<rect x="8" y="12" width="32" height="26" rx="2" fill="none" stroke="white" stroke-width="2.5"/><line x1="8" y1="22" x2="40" y2="22" stroke="white" stroke-width="2.5"/><line x1="20" y1="12" x2="20" y2="38" stroke="white" stroke-width="2.5"/><line x1="8" y1="30" x2="40" y2="30" stroke="white" stroke-width="2.5"/>`,
  'equal': `<line x1="14" y1="20" x2="34" y2="20" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="28" x2="34" y2="28" stroke="white" stroke-width="3" stroke-linecap="round"/>`,
  'column': `<rect x="8" y="14" width="8" height="22" rx="1" fill="none" stroke="white" stroke-width="2.5"/><rect x="20" y="10" width="8" height="26" rx="1" fill="none" stroke="white" stroke-width="2.5"/><rect x="32" y="17" width="8" height="19" rx="1" fill="none" stroke="white" stroke-width="2.5"/>`,
  'bitcoin': `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">B</text>`,
  'bitcoin-small': `<text x="24" y="29" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="white">B</text>`,
  'smile': `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><circle cx="18" cy="22" r="1.5" fill="white"/><circle cx="30" cy="22" r="1.5" fill="white"/><path d="M18 28c2 3 10 3 12 0" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  'hand': `<path d="M18 14v12a6 6 0 0012 0V18M30 14v8a3 3 0 01-3 3M18 14l2-6a2 2 0 014 0v6M24 8V4a2 2 0 014 0v10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'skull': `<circle cx="24" cy="18" r="8" fill="none" stroke="white" stroke-width="2.5"/><circle cx="20" cy="18" r="1.5" fill="white"/><circle cx="28" cy="18" r="1.5" fill="white"/><rect x="18" y="24" width="12" height="8" rx="2" fill="none" stroke="white" stroke-width="2.5"/><line x1="20" y1="24" x2="20" y2="32" stroke="white" stroke-width="1.5"/><line x1="24" y1="24" x2="24" y2="32" stroke="white" stroke-width="1.5"/><line x1="28" y1="24" x2="28" y2="32" stroke="white" stroke-width="1.5"/>`,
};

// ── Tool definitions ──

// Helper: categorize colors for tool
function bg(cat: string): [string, string] { return C[cat] || C['encoding']; }

// Helper: compose multiple symbols with spacing
function compose(...symbols: string[]): string {
  return symbols.map(s => S[s] || '').join('');
}

// All 170+ tool icon definitions
export const toolIcons: Record<string, IconDef> = {
  // ═══ CATEGORIES (for sidebar, category cards) ═══
  'encoding':          { bg: bg('encoding'), fg: compose('arrow-left-right', 'binary') },
  'encryption':        { bg: bg('encryption'), fg: S['lock'] },
  'hashing':           { bg: bg('hashing'), fg: S['hash'] },
  'text':              { bg: bg('text'), fg: S['text-T'] },
  'regex':             { bg: bg('regex'), fg: compose('code-slash', 'star') },
  'data-format':       { bg: bg('data-format'), fg: S['braces'] },
  'network':           { bg: bg('network'), fg: S['globe'] },
  'security':          { bg: bg('security'), fg: S['shield'] },
  'converter':         { bg: bg('converter'), fg: S['arrow-cycle'] },
  'image':             { bg: bg('image'), fg: S['image-landscape'] },
  'css':               { bg: bg('css'), fg: S['palette'] },
  'javascript':        { bg: bg('javascript'), fg: S['code-slash'] },
  'generator':         { bg: bg('generator'), fg: S['sparkle'] },
  'math':              { bg: bg('math'), fg: S['calculator'] },
  'document':          { bg: bg('document'), fg: S['file-text'] },
  'analysis':          { bg: bg('analysis'), fg: S['bar-chart'] },

  // ═══ ENCODING ═══
  'base64':            { bg: bg('encoding'), fg: compose('arrow-left-right', 'binary') },
  'url-encode':        { bg: bg('encoding'), fg: compose('link', 'arrow-right') },
  'html-entity':       { bg: bg('encoding'), fg: compose('code-brackets', 'arrow-right') },
  'unicode':           { bg: bg('encoding'), fg: compose('globe', 'arrow-right') },
  'hex':               { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="white">0x</text>` },
  'binary':            { bg: bg('encoding'), fg: S['binary'] },
  'base32':            { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="white">32</text>` },
  'base58':            { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="white">58</text>` + S['bitcoin-small'] },
  'jwt-decode':        { bg: bg('encoding'), fg: compose('shield', 'arrow-right') },
  'morse':             { bg: bg('encoding'), fg: `<circle cx="16" cy="24" r="3" fill="white"/><line x1="22" y1="24" x2="28" y2="24" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="24" r="3" fill="white"/>` },
  'punycode':          { bg: bg('encoding'), fg: compose('globe', 'link') },
  'charset-convert':   { bg: bg('encoding'), fg: `<text x="14" y="30" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">中</text><path d="M26 18l6 6-6 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="38" y="30" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">A</text>` },
  'utf8':              { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="17" font-weight="bold" fill="white">UTF8</text>` },
  'octal':             { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="white">OCT</text>` },
  'quoted-printable':  { bg: bg('encoding'), fg: compose('mail', 'equal') },
  'base85':            { bg: bg('encoding'), fg: `text x="24" y="30" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="white">85</text>` },
  'braille':           { bg: bg('encoding'), fg: `<circle cx="16" cy="16" r="2" fill="white"/><circle cx="22" cy="16" r="2" fill="white" opacity="0.4"/><circle cx="16" cy="22" r="2" fill="white" opacity="0.4"/><circle cx="22" cy="22" r="2" fill="white"/><circle cx="28" cy="16" r="2" fill="white"/><circle cx="34" cy="16" r="2" fill="white" opacity="0.4"/><circle cx="28" cy="22" r="2" fill="white" opacity="0.4"/><circle cx="34" cy="22" r="2" fill="white"/>` },
  'tap-code':          { bg: bg('encoding'), fg: `<rect x="10" y="14" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="22" y="14" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="10" y="26" width="8" height="8" rx="1" fill="white"/><rect x="22" y="26" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="2"/>` },
  'aaencode':          { bg: bg('encoding'), fg: S['smile'] },

  // ═══ ENCRYPTION ═══
  'aes':               { bg: bg('encryption'), fg: compose('lock', 'star') },
  'des':               { bg: bg('encryption'), fg: S['lock'] },
  '3des':              { bg: bg('encryption'), fg: compose('lock', 'layers') },
  'rsa':               { bg: bg('encryption'), fg: compose('key', 'shield') },
  'rc4':               { bg: bg('encryption'), fg: compose('lock', 'arrow-cycle') },
  'sm4':               { bg: bg('encryption'), fg: `<path d="M24 38s12-6 12-15V12l-12-4-12 4v11c0 9 12 15 12 15z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><text x="24" y="28" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">SM</text>` },
  'sm2':               { bg: bg('encryption'), fg: `<circle cx="24" cy="24" r="12" fill="none" stroke="white" stroke-width="2.5"/><text x="24" y="29" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">SM</text>` },
  'chacha20':          { bg: bg('encryption'), fg: compose('lock', 'activity') },
  'blowfish':          { bg: bg('encryption'), fg: `<path d="M24 10c-4 4-6 10-6 14s2 10 6 14c4-4 6-10 6-14s-2-10-6-14z" fill="none" stroke="white" stroke-width="2.5"/><circle cx="24" cy="24" r="3" fill="white"/>` },
  'rsa-keygen':        { bg: bg('encryption'), fg: compose('key', 'plus') },
  'rabbit':            { bg: bg('encryption'), fg: compose('lock', 'play') },
  'pgp':               { bg: bg('encryption'), fg: compose('lock', 'mail') },
  'aes-keygen':        { bg: bg('encryption'), fg: compose('key', 'star') },

  // ═══ HASHING ═══
  'md5':               { bg: bg('hashing'), fg: compose('hash', 'fingerprint') },
  'sha1':              { bg: bg('hashing'), fg: compose('hash', 'shield-check') },
  'sha256':            { bg: bg('hashing'), fg: compose('hash', 'shield') },
  'sha512':            { bg: bg('hashing'), fg: compose('hash', 'layers') },
  'sha3':              { bg: bg('hashing'), fg: compose('hash', 'star') },
  'sm3':               { bg: bg('hashing'), fg: `<line x1="15" y1="10" x2="15" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="33" y1="10" x2="33" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="18" x2="39" y2="18" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="30" x2="39" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/><text x="40" y="12" text-anchor="start" font-family="sans-serif" font-size="8" font-weight="bold" fill="white">SM</text>` },
  'ripemd160':         { bg: bg('hashing'), fg: compose('fingerprint', 'arrow-right') },
  'hmac':              { bg: bg('hashing'), fg: compose('shield-check', 'key') },
  'crc':               { bg: bg('hashing'), fg: compose('activity', 'check') },
  'bcrypt':            { bg: bg('hashing'), fg: compose('shield', 'gear') },
  'scrypt':            { bg: bg('hashing'), fg: compose('shield', 'layers') },
  'argon2':            { bg: bg('hashing'), fg: compose('shield', 'star') },
  'hash-compare':      { bg: bg('hashing'), fg: compose('hash', 'equal') },
  'hash-all':          { bg: bg('hashing'), fg: compose('hash', 'grid') },

  // ═══ TEXT ═══
  'text-case':         { bg: bg('text'), fg: `<text x="14" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="white">A</text><text x="34" y="30" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="white">a</text>` },
  'text-count':        { bg: bg('text'), fg: compose('text-cursor', 'hash') },
  'text-diff':         { bg: bg('text'), fg: `<line x1="14" y1="18" x2="34" y2="18" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="24" x2="28" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/><line x1="14" y1="30" x2="34" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="14" x2="16" y2="34" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="14" x2="32" y2="34" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>` },
  'text-remove-dup':   { bg: bg('text'), fg: `<line x1="14" y1="16" x2="34" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="22" x2="34" y2="22" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="28" x2="34" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="34" x2="24" y2="34" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="36" y1="14" x2="38" y2="16" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/><line x1="38" y1="14" x2="36" y2="16" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>` },
  'text-remove-empty': { bg: bg('text'), fg: `<line x1="14" y1="16" x2="34" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="24" x2="34" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="32" x2="20" y2="32" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2" opacity="0.4"/><line x1="36" y1="14" x2="38" y2="16" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/><line x1="38" y1="14" x2="36" y2="16" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>` },
  'text-trim':         { bg: bg('text'), fg: S['scissors'] },
  'text-sort':         { bg: bg('text'), fg: `<line x1="14" y1="16" x2="34" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="24" x2="30" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="32" x2="34" y2="32" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M36 14l2 4-2 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M36 22l2-4-2-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` },
  'text-replace':      { bg: bg('text'), fg: compose('arrow-left-right', 'text-T') },
  'text-reverse':      { bg: bg('text'), fg: `<path d="M18 16l-4 8 4 8M30 16l4 8-4 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` },
  'text-pad':          { bg: bg('text'), fg: `<rect x="12" y="14" width="24" height="20" rx="2" fill="none" stroke="white" stroke-width="2.5"/><line x1="24" y1="14" x2="24" y2="34" stroke="white" stroke-width="2.5"/><line x1="16" y1="20" x2="24" y2="20" stroke="white" stroke-width="2"/><line x1="24" y1="28" x2="32" y2="28" stroke="white" stroke-width="2"/>` },
  'text-wrap':         { bg: bg('text'), fg: `<path d="M12 16h16M12 22h14c4 0 6 3 6 6s-2 6-6 6h-4" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>` },
  'text-prefix':       { bg: bg('text'), fg: compose('list', 'hash') },
  'text-extract':      { bg: bg('text'), fg: compose('search', 'mail') },
  'text-split-join':   { bg: bg('text'), fg: `<line x1="14" y1="18" x2="34" y2="18" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="30" x2="34" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M24 20v4M22 22l2 2 2-2" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` },
  'text-chinese':      { bg: bg('text'), fg: `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="white">文</text>` },
  'lorem-ipsum':       { bg: bg('text'), fg: `<text x="24" y="28" text-anchor="middle" font-family="serif" font-size="16" font-weight="bold" fill="white">L</text>` },
  'markdown-preview':  { bg: bg('text'), fg: compose('eye', 'file-text') },
  'text-slugify':      { bg: bg('text'), fg: compose('link', 'minus') },
  'text-escape':       { bg: bg('text'), fg: compose('code-slash', 'arrow-right') },

  // ═══ REGEX ═══
  'regex-tester':      { bg: bg('regex'), fg: `<path d="M12 18l4-12 4 12-4-4h-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="34" cy="18" r="3" fill="none" stroke="white" stroke-width="2.5"/>` },
  'regex-cheatsheet':  { bg: bg('regex'), fg: compose('book', 'star') },
  'regex-generator':   { bg: bg('regex'), fg: compose('wand', 'star') },

  // ═══ DATA-FORMAT ═══
  'json-format':       { bg: bg('data-format'), fg: S['braces'] },
  'json-to-yaml':      { bg: bg('data-format'), fg: compose('braces', 'arrow-right') },
  'yaml-to-json':      { bg: bg('data-format'), fg: compose('arrow-left', 'braces') },
  'json-to-xml':       { bg: bg('data-format'), fg: compose('braces', 'code-brackets') },
  'xml-to-json':       { bg: bg('data-format'), fg: compose('code-brackets', 'braces') },
  'xml-format':        { bg: bg('data-format'), fg: S['code-brackets'] },
  'json-to-csv':       { bg: bg('data-format'), fg: compose('braces', 'table') },
  'csv-to-json':       { bg: bg('data-format'), fg: compose('table', 'braces') },
  'json-to-toml':      { bg: bg('data-format'), fg: compose('braces', 'arrow-right') },
  'toml-to-json':      { bg: bg('data-format'), fg: compose('arrow-left', 'braces') },
  'json-path':         { bg: bg('data-format'), fg: compose('search', 'braces') },
  'json-diff':         { bg: bg('data-format'), fg: compose('braces', 'equal') },
  'json-schema':       { bg: bg('data-format'), fg: compose('braces', 'shield-check') },
  'protobuf-decode':   { bg: bg('data-format'), fg: compose('binary', 'arrow-right') },

  // ═══ NETWORK ═══
  'ip-lookup':         { bg: bg('network'), fg: compose('map-pin', 'search') },
  'ip-calc':           { bg: bg('network'), fg: compose('calculator', 'wifi') },
  'ip-convert':        { bg: bg('network'), fg: compose('arrow-left-right', 'globe') },
  'url-parser':        { bg: bg('network'), fg: compose('link', 'search') },
  'dns-lookup':        { bg: bg('network'), fg: compose('globe', 'search') },
  'dns-propagation':   { bg: bg('network'), fg: compose('globe', 'activity') },
  'curl-generator':    { bg: bg('network'), fg: S['terminal'] },
  'user-agent':        { bg: bg('network'), fg: compose('smartphone', 'search') },
  'port-reference':    { bg: bg('network'), fg: `<rect x="10" y="12" width="28" height="24" rx="2" fill="none" stroke="white" stroke-width="2.5"/><line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/><line x1="16" y1="26" x2="26" y2="26" stroke="white" stroke-width="2"/><circle cx="14" cy="20" r="1.5" fill="white"/><circle cx="14" cy="26" r="1.5" fill="white"/>` },
  'cidr-calc':         { bg: bg('network'), fg: compose('calculator', 'hash') },
  'mac-lookup':        { bg: bg('network'), fg: compose('search', 'binary') },
  'http-headers':      { bg: bg('network'), fg: compose('file-text', 'link') },
  'websocket-test':    { bg: bg('network'), fg: compose('activity', 'link') },
  'whois':             { bg: bg('network'), fg: compose('search', 'globe') },
  'seo-analysis':      { bg: bg('network'), fg: compose('bar-chart', 'search') },
  'multi-ping':        { bg: bg('network'), fg: compose('globe', 'activity') },

  // ═══ SECURITY ═══
  'password-gen':      { bg: bg('security'), fg: compose('key', 'star') },
  'password-strength': { bg: bg('security'), fg: compose('shield', 'bar-chart') },
  'password-breach':   { bg: bg('security'), fg: compose('shield-alert', 'search') },
  'xss-payload':       { bg: bg('security'), fg: compose('bug', 'code-brackets') },
  'sql-inject':        { bg: bg('security'), fg: compose('bug', 'database') },
  'csp-generator':     { bg: bg('security'), fg: compose('shield', 'file-text') },
  'security-headers':  { bg: bg('security'), fg: compose('shield', 'list') },
  'cert-parser':       { bg: bg('security'), fg: compose('award', 'search') },
  'csrf-token':        { bg: bg('security'), fg: compose('key', 'shield') },
  'totp':              { bg: bg('security'), fg: compose('clock', 'key') },
  'steganography':     { bg: bg('security'), fg: compose('eye-off', 'image-landscape') },
  'reverse-shell':     { bg: bg('security'), fg: S['terminal'] },
  'lfi-payload':       { bg: bg('security'), fg: compose('bug', 'file-text') },
  'tty-shell':         { bg: bg('security'), fg: compose('terminal', 'smartphone') },
  'msfvenom':          { bg: bg('security'), fg: compose('skull', 'terminal') },
  'linux-privesc':     { bg: bg('security'), fg: compose('arrow-up', 'terminal') },
  'powershell-commands': { bg: bg('security'), fg: S['terminal'] },
  'file-transfer':     { bg: bg('security'), fg: compose('upload', 'file-text') },
  'windows-commands':  { bg: bg('security'), fg: S['terminal'] },
  'linux-commands':    { bg: bg('security'), fg: S['terminal'] },

  // ═══ CONVERTER ═══
  'timestamp':         { bg: bg('converter'), fg: S['clock'] },
  'radix':             { bg: bg('converter'), fg: compose('binary', 'arrow-cycle') },
  'color-convert':     { bg: bg('converter'), fg: compose('palette', 'arrow-cycle') },
  'unit-convert':      { bg: bg('converter'), fg: compose('arrow-left-right', 'equal') },
  'number-base':       { bg: bg('converter'), fg: compose('hash', 'arrow-right') },
  'ascii-table':       { bg: bg('converter'), fg: S['table'] },
  'unicode-table':     { bg: bg('converter'), fg: compose('globe', 'table') },
  'html-color':        { bg: bg('converter'), fg: S['palette'] },
  'qr-generate':       { bg: bg('converter'), fg: S['qr'] },
  'qr-decode':         { bg: bg('converter'), fg: compose('qr', 'search') },
  'barcode-gen':       { bg: bg('converter'), fg: S['barcode'] },

  // ═══ IMAGE ═══
  'image-compress':    { bg: bg('image'), fg: compose('image-landscape', 'minimize') },
  'image-resize':      { bg: bg('image'), fg: compose('image-landscape', 'maximize') },
  'image-crop':        { bg: bg('image'), fg: S['crop'] },
  'image-convert':     { bg: bg('image'), fg: compose('image-landscape', 'arrow-cycle') },
  'image-watermark':   { bg: bg('image'), fg: compose('image-landscape', 'droplet') },
  'image-base64':      { bg: bg('image'), fg: compose('image-landscape', 'binary') },
  'image-metadata':    { bg: bg('image'), fg: compose('image-landscape', 'list') },
  'image-split':       { bg: bg('image'), fg: S['grid'] },
  'svg-optimizer':     { bg: bg('image'), fg: compose('minimize', 'brackets') },
  'ico-convert':       { bg: bg('image'), fg: `<rect x="14" y="10" width="20" height="28" rx="3" fill="none" stroke="white" stroke-width="2.5"/><circle cx="24" cy="20" r="5" fill="none" stroke="white" stroke-width="2.5"/><circle cx="24" cy="20" r="2" fill="white"/>` },
  'favicon-gen':       { bg: bg('image'), fg: compose('star', 'image-landscape') },

  // ═══ CSS ═══
  'css-gradient':      { bg: bg('css'), fg: compose('palette', 'arrow-down') },
  'css-shadow':        { bg: bg('css'), fg: `<rect x="14" y="14" width="20" height="14" rx="2" fill="white" opacity="0.3"/><rect x="12" y="18" width="24" height="16" rx="2" fill="none" stroke="white" stroke-width="2.5"/>` },
  'css-flexbox':       { bg: bg('css'), fg: S['column'] },
  'css-grid':          { bg: bg('css'), fg: S['grid'] },
  'css-animation':     { bg: bg('css'), fg: compose('play', 'star') },
  'css-minify':        { bg: bg('css'), fg: compose('minimize', 'palette') },

  // ═══ JAVASCRIPT ═══
  'js-minify':         { bg: bg('javascript'), fg: compose('minimize', 'code-slash') },
  'js-format':         { bg: bg('javascript'), fg: compose('code-slash', 'list') },
  'js-beautify':       { bg: bg('javascript'), fg: compose('code-slash', 'star') },
  'js-run':            { bg: bg('javascript'), fg: S['play'] },
  'js-obfuscate':      { bg: bg('javascript'), fg: compose('eye-off', 'code-slash') },
  'js-deobfuscate':    { bg: bg('javascript'), fg: compose('eye', 'code-slash') },
  'babel-transform':   { bg: bg('javascript'), fg: compose('arrow-cycle', 'code-slash') },
  'typescript-play':   { bg: bg('javascript'), fg: `<text x="24" y="29" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="bold" fill="white">TS</text>` },

  // ═══ GENERATOR ═══
  'uuid':              { bg: bg('generator'), fg: compose('fingerprint', 'star') },
  'ulid':              { bg: bg('generator'), fg: compose('fingerprint', 'clock') },
  'nanoid':            { bg: bg('generator'), fg: compose('fingerprint', 'minimize') },
  'random-string':     { bg: bg('generator'), fg: compose('shuffle', 'text-T') },
  'random-number':     { bg: bg('generator'), fg: compose('dice', 'hash') },
  'hash-batch':        { bg: bg('generator'), fg: compose('hash', 'layers') },
  'chinese-lorem':     { bg: bg('generator'), fg: `<text x="24" y="28" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">中文</text>` },
  'fake-data':         { bg: bg('generator'), fg: compose('database', 'smile') },

  // ═══ MATH ═══
  'base-calculator':   { bg: bg('math'), fg: compose('calculator', 'binary') },
  'bit-calculator':    { bg: bg('math'), fg: compose('calculator', 'hash') },
  'math-expression':   { bg: bg('math'), fg: S['calculator'] },
  'percentage-calc':   { bg: bg('math'), fg: S['percent'] },
  'bmi-calc':          { bg: bg('math'), fg: compose('activity', 'equal') },

  // ═══ DOCUMENT ═══
  'html-to-md':        { bg: bg('document'), fg: compose('code-brackets', 'arrow-right') },
  'md-to-html':        { bg: bg('document'), fg: compose('arrow-left', 'code-brackets') },
  'csv-to-sql':        { bg: bg('document'), fg: compose('table', 'database') },
  'sql-to-csv':        { bg: bg('document'), fg: compose('database', 'table') },
  'json-to-ts':        { bg: bg('document'), fg: compose('braces', 'code-slash') },
  'json-to-go':        { bg: bg('document'), fg: compose('braces', 'code-slash') },
  'json-to-java':      { bg: bg('document'), fg: compose('braces', 'code-slash') },
  'json-to-mysql':     { bg: bg('document'), fg: compose('braces', 'database') },
  'excel-to-json':     { bg: bg('document'), fg: compose('table', 'braces') },
  'pdf-to-text':       { bg: bg('document'), fg: compose('file-text', 'arrow-right') },

  // ═══ ANALYSIS ═══
  'frequency-analysis': { bg: bg('analysis'), fg: S['bar-chart'] },
  'entropy-calc':      { bg: bg('analysis'), fg: compose('activity', 'calculator') },
  'base-detect':       { bg: bg('analysis'), fg: compose('search', 'binary') },
  'charset-detect':    { bg: bg('analysis'), fg: compose('search', 'globe') },
  'binary-analysis':   { bg: bg('analysis'), fg: compose('binary', 'search') },
};

// Aliases: tools that share the same icon (e.g., url-encode in both encoding + network)
export const toolIconAliases: Record<string, string> = {};

export function getToolIcon(toolId: string): IconDef | undefined {
  return toolIcons[toolId] || toolIcons[toolIconAliases[toolId]];
}
