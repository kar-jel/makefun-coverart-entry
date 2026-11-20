import { LOOKS } from "./state.js";

// Namespaced local-storage key used only for user-created cover presets.
export const STORAGE_KEY = "makefun.coverart.presets.v1";

const variations = [
  { suffix: "Afterglow", caption: "AFTER THE GLOW", hue: -8, saturation: 1.12, contrast: 1.08, warmth: 12 },
  { suffix: "Neon Nights", caption: "CITY NEVER SLEEPS", hue: 8, saturation: 1.28, contrast: 1.2, warmth: -8 },
  { suffix: "City Heat", caption: "NO RULES TONIGHT", hue: 2, saturation: 1.2, contrast: 1.14, warmth: 20 },
];

// Build complete built-in looks from the editor's five canonical themes.
const builtins = Object.entries(LOOKS).flatMap(([key, look]) => variations.map((variant, index) => ({
  id: `${key}-${index}`,
  name: `${look.label} ${variant.suffix}`,
  label: `${look.label} · ${variant.suffix}`,
  grade: look.grade,
  lettering: look.lettering,
  decor: look.decor,
  caption: variant.caption,
  hue: variant.hue,
  saturation: Math.round(variant.saturation * 100),
  contrast: Math.round(variant.contrast * 100),
  warmth: variant.warmth,
  vignette: 38,
  capSize: 9,
  spacing: 3,
  outline: 4,
  shadow: 8,
  capY: 87,
  filters: [{ name: "grade", options: { hue: variant.hue, saturation: variant.saturation,
    contrast: variant.contrast, warmth: variant.warmth } }],
  layers: [{ type: "text", text: variant.caption, x: 0.5, y: 0.87, visible: true }],
})));

// Parse saved presets defensively; malformed data never hides built-ins.
function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

// Return built-in and saved presets, recovering gracefully from storage errors.
export function listPresets() {
  return [...builtins, ...readSaved()];
}

// Save a named user preset and return the stored record.
export function savePreset(preset) {
  if (!preset || typeof preset !== "object") throw new TypeError("A preset object is required");
  const saved = readSaved();
  const record = { ...preset, id: preset.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  saved.push(record);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    return null;
  }
  return record;
}

// Find a preset by id, returning null when it does not exist.
export function loadPreset(id) {
  return listPresets().find((preset) => preset.id === id) || null;
}

// Delete a saved preset without allowing built-in presets to be removed.
export function deletePreset(id) {
  if (builtins.some((preset) => preset.id === id)) return false;
  const saved = readSaved();
  const remaining = saved.filter((preset) => preset.id !== id);
  if (remaining.length === saved.length) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return true;
  } catch {
    return false;
  }
}

// Choose one preset from the available built-in and saved looks.
export function randomPreset() {
  const presets = listPresets();
  return presets[Math.floor(Math.random() * presets.length)] || builtins[0];
}
