export const LAYOUTS = {
  triptych: {
    label: "TRIPTYCH",
    panels: [
      { x: 0.025, y: 0.035, w: 0.305, h: 0.86 },
      { x: 0.3475, y: 0.035, w: 0.305, h: 0.86 },
      { x: 0.67, y: 0.035, w: 0.305, h: 0.86 },
    ],
  },
  grid: {
    label: "2 × 2 GRID",
    panels: [
      { x: 0.025, y: 0.035, w: 0.46, h: 0.42 },
      { x: 0.515, y: 0.035, w: 0.46, h: 0.42 },
      { x: 0.025, y: 0.485, w: 0.46, h: 0.41 },
      { x: 0.515, y: 0.485, w: 0.46, h: 0.41 },
    ],
  },
  single: {
    label: "FULL BLEED",
    panels: [{ x: 0.025, y: 0.035, w: 0.95, h: 0.86 }],
  },
};
export const GRADES = {
  neon: { label: "NEON VICE", hue: -18, sat: 1.8, contrast: 1.55, warm: -18, vignette: 0.58, tint: true },
  sunset: {
    label: "Sunset",
    hue: 0,
    sat: 1.34,
    contrast: 1.12,
    warm: 12,
    vignette: 0.34,
  },
  dusk: {
    label: "Miami Dusk",
    hue: -12,
    sat: 1.18,
    contrast: 1.1,
    warm: -8,
    vignette: 0.42,
  },
  noir: {
    label: "Neon Noir",
    hue: 18,
    sat: 1.45,
    contrast: 1.3,
    warm: -14,
    vignette: 0.52,
  },
  acid: {
    label: "Acid",
    hue: 68,
    sat: 1.42,
    contrast: 1.17,
    warm: 4,
    vignette: 0.3,
  },
};
export const LETTERING = {
  stacked: { label: "STACKED OUTLINE", mode: "stacked" },
  gradient: { label: "SUNSET GRADIENT", mode: "gradient" },
  neon: { label: "NEON GLOW", mode: "neon" },
};
export const LOOKS = {
  neon: { label: "NEON VICE", grade: "neon", lettering: "gradient", decor: true },
  sunset: {
    label: "SUNSET",
    grade: "sunset",
    lettering: "stacked",
    decor: true,
  },
  dusk: {
    label: "MIAMI DUSK",
    grade: "dusk",
    lettering: "gradient",
    decor: true,
  },
  noir: { label: "NEON NOIR", grade: "noir", lettering: "neon", decor: false },
  acid: {
    label: "ACID CITY",
    grade: "acid",
    lettering: "stacked",
    decor: true,
  },
};
export const SIZES = {
  square: { label: "SQUARE · 1080 × 1080", width: 1080, height: 1080 },
  portrait: { label: "PORTRAIT · 1080 × 1350", width: 1080, height: 1350 },
  landscape: { label: "LANDSCAPE · 1920 × 1080", width: 1920, height: 1080 },
};
export const state = {
  layout: "triptych",
  size: "square",
  photos: [],
  crops: LAYOUTS.triptych.panels.map(() => ({
    photo: 0,
    x: 0,
    y: 0,
    zoom: 1,
    rotate: 0,
    flip: false,
  })),
  selected: 0,
  varyPanels: true,
  grade: "neon",
  lettering: "stacked",
  look: "neon",
  decor: true,
  caption: "LIVE WITHOUT LIMITS",
  hue: 0,
  saturation: 120,
  contrast: 110,
  warmth: 8,
  vignette: 38,
  capSize: 9,
  spacing: 3,
  outline: 4,
  shadow: 8,
  capY: 87,
};
export function resetState() {
  Object.assign(state, {
    layout: "triptych",
    size: "square",
    photos: [],
    crops: LAYOUTS.triptych.panels.map(() => ({
      photo: 0,
      x: 0,
      y: 0,
      zoom: 1,
      rotate: 0,
      flip: false,
    })),
    selected: 0,
    varyPanels: true,
  grade: "neon",
  lettering: "stacked",
  look: "neon",
    decor: true,
    caption: "LIVE WITHOUT LIMITS",
    hue: 0,
    saturation: 120,
    contrast: 110,
    warmth: 8,
    vignette: 38,
    capSize: 9,
    spacing: 3,
    outline: 4,
    shadow: 8,
    capY: 87,
  });
}
