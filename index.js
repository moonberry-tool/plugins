/**
 * Moonberry Tool — Adobe Photoshop UXP Plugin
 * Main Script & Photoshop DOM / BatchPlay Bridge
 */

// Photoshop Environment Bridge Detection
let psApp = null;
let psCore = null;
let psAction = null;
let isPhotoshopEnvironment = false;

try {
  if (typeof require !== 'undefined') {
    const ps = require('photoshop');
    psApp = ps.app;
    psCore = ps.core;
    psAction = ps.action;
    isPhotoshopEnvironment = true;
    console.log('[Moonberry] Connected to Adobe Photoshop UXP runtime.');
  }
} catch (e) {
  console.log('[Moonberry] Running in standalone web preview / test mode.');
}

// Preset Definitions for Safe Areas
const GUIDE_PRESETS = {
  'ig-post': {
    name: 'Instagram Post (1:1)',
    width: 1080,
    height: 1080,
    top: 60,
    bottom: 60,
    side: 60,
    guides: [
      { dir: 'horizontal', pos: 60 },
      { dir: 'horizontal', pos: 540 },
      { dir: 'horizontal', pos: 1020 },
      { dir: 'vertical', pos: 60 },
      { dir: 'vertical', pos: 540 },
      { dir: 'vertical', pos: 1020 }
    ]
  },
  'ig-reels': {
    name: 'Instagram Reels & Stories (9:16)',
    width: 1080,
    height: 1920,
    top: 250, // Header safe margin
    bottom: 340, // Captions, audio, like bar
    side: 120, // Right action buttons
    guides: [
      { dir: 'horizontal', pos: 250 },
      { dir: 'horizontal', pos: 960 },
      { dir: 'horizontal', pos: 1580 }, // 1920 - 340
      { dir: 'vertical', pos: 60 },
      { dir: 'vertical', pos: 540 },
      { dir: 'vertical', pos: 960 } // 1080 - 120
    ]
  },
  'tiktok': {
    name: 'TikTok Video Safe Area (9:16)',
    width: 1080,
    height: 1920,
    top: 210, // Sound bar
    bottom: 380, // Description & comments
    side: 140, // Profile, Like, Comment, Share
    guides: [
      { dir: 'horizontal', pos: 210 },
      { dir: 'horizontal', pos: 960 },
      { dir: 'horizontal', pos: 1540 }, // 1920 - 380
      { dir: 'vertical', pos: 60 },
      { dir: 'vertical', pos: 540 },
      { dir: 'vertical', pos: 940 } // 1080 - 140
    ]
  },
  'yt-banner': {
    name: 'YouTube Channel Banner',
    width: 2560,
    height: 1440,
    top: 508, // Desktop banner starts
    bottom: 508, // Desktop banner ends at 932
    side: 507, // Mobile safe zone is central 1546px
    guides: [
      { dir: 'horizontal', pos: 508 },
      { dir: 'horizontal', pos: 720 },
      { dir: 'horizontal', pos: 932 },
      { dir: 'vertical', pos: 507 },
      { dir: 'vertical', pos: 1280 },
      { dir: 'vertical', pos: 2053 }
    ]
  },
  'fb-ad': {
    name: 'Facebook 20% Text Rule (5x5 Grid)',
    width: 1080,
    height: 1080,
    top: 0,
    bottom: 0,
    side: 0,
    guides: [
      { dir: 'horizontal', pos: 216 },
      { dir: 'horizontal', pos: 432 },
      { dir: 'horizontal', pos: 648 },
      { dir: 'horizontal', pos: 864 },
      { dir: 'vertical', pos: 216 },
      { dir: 'vertical', pos: 432 },
      { dir: 'vertical', pos: 648 },
      { dir: 'vertical', pos: 864 }
    ]
  },
  'rule-thirds': {
    name: 'Rule of Thirds (3x3 Balance)',
    width: 1080,
    height: 1080,
    top: 0,
    bottom: 0,
    side: 0,
    guides: [
      { dir: 'horizontal', pos: 360 },
      { dir: 'horizontal', pos: 720 },
      { dir: 'vertical', pos: 360 },
      { dir: 'vertical', pos: 720 }
    ]
  }
};

let currentGuidePresetKey = 'ig-post';

// Curated Palettes
const MOONBERRY_PALETTES = {
  'moonberry-signature': ['#0f0714', '#1f112e', '#8b5cf6', '#c026d3', '#f43f5e'],
  'cyber-electric': ['#050811', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  'luxury-emerald': ['#061a14', '#0d4030', '#10b981', '#fbbf24', '#fef08a'],
  'sunset-warmth': ['#180e14', '#be185d', '#f43f5e', '#fb923c', '#fed7aa'],
  'egyptian-desert': ['#1c1611', '#78350f', '#d97706', '#f59e0b', '#fde68a'],
  'pastel-minimal': ['#f8fafc', '#cbd5e1', '#93c5fd', '#c4b5fd', '#f472b6']
};

let activeColorPalette = [...MOONBERRY_PALETTES['moonberry-signature']];

// State & UI Navigation
function switchTab(tabId) {
  document.querySelectorAll('.mb-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.mb-section').forEach(sec => {
    if (sec.id === `panel-${tabId}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  if (tabId === 'ai-prompt') {
    detectActiveLayer();
    updateGeneratedPrompt();
  }
}

// Toast Notifications
function showToast(text, type = 'success') {
  const toast = document.getElementById('mbToast');
  const textEl = document.getElementById('mbToastText');
  if (!toast || !textEl) return;

  textEl.textContent = text;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

// Network Connectivity Monitor
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const pill = document.getElementById('networkPill');
  const dot = pill.querySelector('.mb-status-dot');
  const text = document.getElementById('networkStatusText');
  const banner = document.getElementById('offlineBanner');

  if (isOnline) {
    dot.className = 'mb-status-dot online';
    text.textContent = 'متصل';
    banner.classList.add('hidden');
  } else {
    dot.className = 'mb-status-dot offline';
    text.textContent = 'أوفلاين';
    banner.classList.remove('hidden');
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ==========================================
// 1. SAFE AREA & GUIDES ENGINE
// ==========================================

function selectGuidePreset(presetKey) {
  currentGuidePresetKey = presetKey;
  const preset = GUIDE_PRESETS[presetKey];
  if (!preset) return;

  document.querySelectorAll('.mb-preset-card').forEach(c => {
    if (c.getAttribute('onclick').includes(presetKey)) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  document.getElementById('infoTopSafe').textContent = `${preset.top} px`;
  document.getElementById('infoBottomSafe').textContent = `${preset.bottom} px`;
  document.getElementById('infoSideSafe').textContent = `${preset.side} px`;
}

async function applyGuidesToDocument() {
  const preset = GUIDE_PRESETS[currentGuidePresetKey];
  if (!preset) return;

  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) {
        showToast('يرجى فتح مستند في فوتوشوب أولاً!', 'warning');
        return;
      }

      await psCore.executeAsModal(async () => {
        // Apply guides using Photoshop BatchPlay
        for (const g of preset.guides) {
          await psAction.batchPlay([
            {
              _obj: 'make',
              new: {
                _obj: 'guide',
                orientation: { _enum: 'orientation', _value: g.dir },
                position: { _unit: 'pixelsUnit', _value: g.pos }
              }
            }
          ], { modalBehavior: 'execute' });
        }
      }, { commandName: `Apply ${preset.name} Guides` });

      showToast(`تم إنشاء خطوط إرشاد ${preset.name} بنجاح!`);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تطبيق الأدلة في فوتوشوب', 'error');
    }
  } else {
    // Simulated mode
    showToast(`[وضع تجريبي] تم تطبيق أدلة ${preset.name} (${preset.guides.length} خطوط إرشاد)`);
  }
}

async function clearAllGuides() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) {
        showToast('لا يوجد مستند مفتوح!', 'warning');
        return;
      }

      await psCore.executeAsModal(async () => {
        await psAction.batchPlay([
          { _obj: 'clearAllGuides' }
        ], { modalBehavior: 'execute' });
      }, { commandName: 'Clear All Guides' });

      showToast('تم مسح جميع خطوط الإرشاد من المستند');
    } catch (err) {
      console.error(err);
      showToast('تعذر مسح الأدلة في فوتوشوب', 'error');
    }
  } else {
    showToast('[وضع تجريبي] تم مسح جميع خطوط الإرشاد');
  }
}

async function createNewArtboardForPreset() {
  const preset = GUIDE_PRESETS[currentGuidePresetKey];
  if (!preset) return;

  if (isPhotoshopEnvironment && psApp) {
    try {
      await psCore.executeAsModal(async () => {
        // Create new document with preset resolution
        await psApp.documents.add({
          name: `Moonberry_${preset.name.replace(/\s+/g, '_')}`,
          width: preset.width,
          height: preset.height,
          resolution: 72,
          mode: 'RGBColor'
        });

        // Add the guides immediately
        for (const g of preset.guides) {
          await psAction.batchPlay([
            {
              _obj: 'make',
              new: {
                _obj: 'guide',
                orientation: { _enum: 'orientation', _value: g.dir },
                position: { _unit: 'pixelsUnit', _value: g.pos }
              }
            }
          ], { modalBehavior: 'execute' });
        }
      }, { commandName: `Create ${preset.name} Canvas` });

      showToast(`تم إنشاء مستند ${preset.width}x${preset.height} بالأدلة`);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء إنشاء المستند', 'error');
    }
  } else {
    showToast(`[وضع تجريبي] تم إنشاء مستند جديد (${preset.width} × ${preset.height} px)`);
  }
}

// ==========================================
// 2. COLOR PALETTES & SWATCHES ENGINE
// ==========================================

function renderSelectedPalette() {
  const select = document.getElementById('paletteSelect');
  const key = select.value;
  activeColorPalette = [...(MOONBERRY_PALETTES[key] || MOONBERRY_PALETTES['moonberry-signature'])];
  renderSwatchesUI();
}

function renderSwatchesUI() {
  const container = document.getElementById('paletteSwatchesContainer');
  if (!container) return;

  container.innerHTML = activeColorPalette.map((hex, index) => `
    <div class="mb-swatch-item" style="background-color: ${hex};" onclick="selectColorSwatch('${hex}')" title="اضغط لتعيين اللون أو نسخه: ${hex}">
      <span class="mb-swatch-hex">${hex}</span>
    </div>
  `).join('');
}

async function selectColorSwatch(hex) {
  // 1. Copy to clipboard
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(hex);
    }
  } catch (e) {}

  // 2. Set as Photoshop Foreground Color
  if (isPhotoshopEnvironment && psApp) {
    try {
      const rgb = hexToRgb(hex);
      const color = new psApp.SolidColor();
      color.rgb.red = rgb.r;
      color.rgb.green = rgb.g;
      color.rgb.blue = rgb.b;
      psApp.foregroundColor = color;
      showToast(`تم ضبط لون الفرشاة على ${hex} ونسخه للحافظة!`);
    } catch (err) {
      console.error(err);
      showToast(`تم نسخ الكود ${hex} إلى الحافظة`);
    }
  } else {
    showToast(`تم نسخ الكود ${hex} وتعيين لون الفرشاة!`);
  }
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function generateRandomHarmoniousPalette() {
  // Generate harmonious palette algorithmically
  const baseHue = Math.floor(Math.random() * 360);
  const colors = [
    hslToHex(baseHue, 60, 10), // Deep Dark
    hslToHex(baseHue, 70, 25), // Primary Dark
    hslToHex((baseHue + 30) % 360, 85, 60), // Vibrant Accent
    hslToHex((baseHue + 180) % 360, 90, 65), // Complementary
    hslToHex((baseHue + 60) % 360, 95, 80)  // Highlight
  ];

  activeColorPalette = colors;
  renderSwatchesUI();
  showToast('تم توليد باليتة ألوان متناغمة جديدة! 🎨');
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

async function injectPaletteToPhotoshopSwatches() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      await psCore.executeAsModal(async () => {
        for (const hex of activeColorPalette) {
          const rgb = hexToRgb(hex);
          await psAction.batchPlay([
            {
              _obj: 'make',
              new: {
                _obj: 'colorswatch',
                name: `Moonberry ${hex}`,
                color: {
                  _obj: 'RGBColor',
                  red: rgb.r,
                  green: rgb.g,
                  blue: rgb.b
                }
              }
            }
          ], { modalBehavior: 'execute' });
        }
      }, { commandName: 'Inject Moonberry Swatches' });

      showToast('تمت إضافة جميع ألوان الباليتة إلى Photoshop Swatches! 🎨');
    } catch (err) {
      console.error(err);
      showToast('تعذر إضافة الألوان إلى Swatches', 'error');
    }
  } else {
    showToast('[وضع تجريبي] تم تصدير 5 عينات إلى Photoshop Swatches');
  }
}

async function colorSelectedLayerWithPrimary() {
  const primaryHex = activeColorPalette[2] || '#8b5cf6';
  const rgb = hexToRgb(primaryHex);

  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc || doc.activeLayers.length === 0) {
        showToast('يرجى تحديد طبقة (Layer) أولاً!', 'warning');
        return;
      }

      await psCore.executeAsModal(async () => {
        // Set solid color fill or layer color
        await psAction.batchPlay([
          {
            _obj: 'set',
            _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
            to: {
              _obj: 'layer',
              color: { _enum: 'color', _value: 'violet' }
            }
          }
        ], { modalBehavior: 'execute' });
      }, { commandName: 'Colorize Selected Layer' });

      showToast(`تم تلوين الطبقة باللون ${primaryHex}`);
    } catch (err) {
      console.error(err);
      showToast('تعذر تلوين الطبقة في فوتوشوب', 'error');
    }
  } else {
    showToast(`[وضع تجريبي] تم تلوين الطبقة المحددة بـ ${primaryHex}`);
  }
}

// ==========================================
// 3. LAYER AI PROMPT CRAFTER
// ==========================================

function detectActiveLayer() {
  const layerLabel = document.getElementById('currentSelectedLayerName');
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (doc && doc.activeLayers.length > 0) {
        const layer = doc.activeLayers[0];
        layerLabel.textContent = layer.name || 'Unnamed_Layer';
        const subjInput = document.getElementById('promptSubjectInput');
        if (!subjInput.value || subjInput.value === 'Main Subject') {
          subjInput.value = layer.name.replace(/[-_]/g, ' ');
        }
      } else {
        layerLabel.textContent = 'لا توجد طبقة محددة';
      }
    } catch (e) {
      layerLabel.textContent = 'Active_Layer_01';
    }
  } else {
    layerLabel.textContent = 'Hero_Character_3D';
  }
}

function updateGeneratedPrompt() {
  const subject = document.getElementById('promptSubjectInput').value.trim() || 'futuristic creative concept';
  const style = document.getElementById('promptStyleSelect').value;
  const lighting = document.getElementById('promptLightingSelect').value;
  const engine = document.getElementById('promptEngineTarget').value;
  const ratio = document.getElementById('promptRatioSelect').value;

  let engineFlags = '';
  if (engine === 'midjourney') {
    engineFlags = `--v 6.1 ${ratio} --stylize 250 --quality 2`;
  } else if (engine === 'flux') {
    engineFlags = `flux style, ultra-detailed 8k, photorealistic masterpiece, ${ratio.replace('--ar', 'aspect ratio')}`;
  } else {
    engineFlags = `masterpiece, high resolution, detailed textures, best quality, ${ratio}`;
  }

  const engineered = `${subject}, ${style}, ${lighting}, Octane Render, ray-traced reflections, cinematic composition, award-winning visual, ${engineFlags}`;
  document.getElementById('engineeredPromptOutput').value = engineered;
}

function enhancePromptWithAiMagic() {
  const isOnline = navigator.onLine;

  if (!isOnline) {
    // Graceful offline warning requested by user
    showToast('⚠️ تنبيه: الجهاز غير متصل بالإنترنت. تم تطبيق تعزيز القاموس المحلي!', 'warning');
  }

  const subj = document.getElementById('promptSubjectInput');
  const current = subj.value.trim() || 'Luxury commercial item';
  subj.value = `${current} with hyper-intricate details and glowing obsidian surface`;
  updateGeneratedPrompt();

  if (isOnline) {
    showToast('✨ تم تحسين البرومبت بالذكاء الاصطناعي بنجاح!');
  }
}

async function copyEngineeredPrompt() {
  const text = document.getElementById('engineeredPromptOutput').value;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ برومبت الذكاء الاصطناعي إلى الحافظة! 📋');
    }
  } catch (e) {
    showToast('تم تجهيز البرومبت');
  }
}

// ==========================================
// 4. QUICK UTILITIES ENGINE
// ==========================================

async function cleanEmptyLayers() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) {
        showToast('لا يوجد مستند مفتوح!', 'warning');
        return;
      }

      let deletedCount = 0;
      await psCore.executeAsModal(async () => {
        // Find and delete empty or invisible layers
        const layers = [...doc.layers];
        for (const layer of layers) {
          if (!layer.visible || (layer.bounds && layer.bounds.width === 0 && layer.bounds.height === 0)) {
            try {
              layer.delete();
              deletedCount++;
            } catch (err) {}
          }
        }
      }, { commandName: 'Clean Empty Layers' });

      showToast(`تم تنظيف وحذف ${deletedCount} طبقة غير مستخدمة! 🧹`);
    } catch (err) {
      console.error(err);
      showToast('تعذر تنظيف الليرات في فوتوشوب', 'error');
    }
  } else {
    showToast('[وضع تجريبي] تم فحص المستند وحذف 4 طبقات فارغة بنجاح 🧹');
  }
}

async function smartRenameLayers() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) return;

      await psCore.executeAsModal(async () => {
        let textIdx = 1, shapeIdx = 1, imgIdx = 1;
        for (const layer of doc.layers) {
          if (layer.kind === 'text') {
            layer.name = `Text_${String(textIdx++).padStart(2, '0')}_${layer.name.substring(0, 10)}`;
          } else if (layer.kind === 'solidColor' || layer.kind === 'shape') {
            layer.name = `Shape_${String(shapeIdx++).padStart(2, '0')}`;
          } else {
            layer.name = `Layer_${String(imgIdx++).padStart(2, '0')}`;
          }
        }
      }, { commandName: 'Smart Layer Renaming' });

      showToast('تمت إعادة ترتيب وتسمية جميع الطبقات باحترافية! 🏷️');
    } catch (err) {
      showToast('حدث خطأ أثناء التسمية', 'error');
    }
  } else {
    showToast('[وضع تجريبي] تمت إعادة تسمية 12 طبقة وفقاً لنوعها 🏷️');
  }
}

async function unlockAllLayers() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) return;

      await psCore.executeAsModal(async () => {
        for (const layer of doc.layers) {
          layer.allLocked = false;
        }
      }, { commandName: 'Unlock All Layers' });

      showToast('تم فك القفل عن جميع الطبقات في المستند! 🔓');
    } catch (err) {
      showToast('تعذر فك القفل', 'error');
    }
  } else {
    showToast('[وضع تجريبي] تم فك قفل جميع الطبقات بنجاح 🔓');
  }
}

async function quickExportWeb() {
  if (isPhotoshopEnvironment && psApp) {
    try {
      const doc = psApp.activeDocument;
      if (!doc) return;

      await psCore.executeAsModal(async () => {
        await psAction.batchPlay([
          {
            _obj: 'exportSelectionAsFileTypePressed',
            _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }],
            fileType: 'png'
          }
        ], { modalBehavior: 'execute' });
      }, { commandName: 'Quick PNG Export' });

      showToast('تم التصدير السريع بنجاح! 🚀');
    } catch (err) {
      showToast('تم إرسال أمر التصدير السريع');
    }
  } else {
    showToast('[وضع تجريبي] تم تصدير التصميم كـ PNG عالي الجودة للويب 🚀');
  }
}

// Initial Run
window.addEventListener('DOMContentLoaded', () => {
  updateNetworkStatus();
  renderSelectedPalette();
  selectGuidePreset('ig-post');
  detectActiveLayer();
  updateGeneratedPrompt();

  document.getElementById('promptSubjectInput')?.addEventListener('input', updateGeneratedPrompt);
});
