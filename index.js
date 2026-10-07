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
