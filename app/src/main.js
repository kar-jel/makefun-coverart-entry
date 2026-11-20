import {
  state,
  LAYOUTS,
  GRADES,
  LETTERING,
  LOOKS,
  SIZES,
  resetState,
} from "./state.js";
import {
  loadPhoto,
  loadSample,
  fitPanels,
  refreshPhotoList,
} from "./photos.js";
import { drawPoster } from "./render.js";
import { bindControls } from "./controls.js";
import { exportPng, renderPngDataUrl } from "./export.js";
import { defaultLayers } from "./layers.js";
import { createHistory } from "./history.js";
import { listPresets } from "./presets.js";
import { runPipeline } from "./filters.js";
import { drawLayers } from "./layers.js";
window.makefunFilterPipeline = runPipeline;
window.makefunModules = { filters: ["applyGrade", "runPipeline", "cacheKey", "clearCache", "cacheStats"], layers: ["defaultLayers", "addLayer", "removeLayer", "move", "hitTest", "drawLayers"], history: ["createHistory", "push", "undo", "redo", "canUndo", "canRedo", "clear", "describe"], presets: ["listPresets", "savePreset", "loadPreset", "deletePreset", "randomPreset"] };
window.makefunHistory = createHistory(60);
state.layers = defaultLayers();
state.layers.find((layer) => layer.name === "VICE FRAME").visible = false;
state.layers.find((layer) => layer.name === "Credit").visible = false;
// Bind the editable headline layer to the same default caption as the painted lockup.
state.layers.find((layer) => layer.name === "Caption").visible = false;
state.layers.find((layer) => layer.name === "COMING SOON").visible = false;
// Ensure one-click reset also starts from the clean art-directed defaults.
const resetButton = document.querySelector("#resetAll");
resetButton.addEventListener("click", () => {
  state.layers = defaultLayers();
  for (const name of ["VICE FRAME", "Credit", "Caption", "COMING SOON"]) {
    const layer = state.layers.find((item) => item.name === name);
    if (layer) layer.visible = false;
  }
  setLayout(state.layout);
  syncInputs();
  render();
});
// Ensure one-click reset also starts from the clean art-directed defaults.
const resetButton = document.querySelector("#resetAll");
resetButton.addEventListener("click", () => {
  state.layers = defaultLayers();
  for (const name of ["VICE FRAME", "Credit", "Caption", "COMING SOON"]) {
    const layer = state.layers.find((item) => item.name === name);
    if (layer) layer.visible = false;
  }
  setLayout(state.layout);
  syncInputs();
  render();
});
const canvas = document.querySelector("#poster"),
  ctx = canvas.getContext("2d");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let dpr = 1,
  drag = null,
  toastTimer;
function activeLayout() {
  return LAYOUTS[state.layout];
}
function fitCanvas() {
  const r = document.querySelector(".canvaswrap").getBoundingClientRect(),
    ratio = state.size === "landscape" ? 16 / 9 : 1;
  let w = Math.max(1, r.width - 30),
    h = Math.max(1, r.height - 30);
  if (w / h > ratio) w = h * ratio;
  else h = w / ratio;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.round(w * 2);
  canvas.height = Math.round(h * 2);
  dpr = canvas.width;
  render();
}
function render() {
  if (!ctx) return;
  drawPoster(ctx, canvas.width, canvas.height, state);
  drawLayers(ctx, canvas.width, canvas.height, state.layers);
}
function toast(s) {
  const e = document.querySelector("#toast");
  e.textContent = s;
  e.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.classList.remove("show"), 1900);
}
function select(i) {
  state.selected = i;
  document.querySelector("#selectedName").textContent =
    `PANEL ${String(i + 1).padStart(2, "0")}`;
  render();
}
function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / r.width,
    y: (e.clientY - r.top) / r.height,
  };
}
function panelAt(e) {
  const p = pos(e),
    boxes = activeLayout().panels;
  return boxes.findIndex(
    (b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h,
  );
}
canvas.addEventListener("pointerdown", (e) => {
  const i = panelAt(e);
  if (i < 0) return;
  select(i);
  drag = { ...pos(e), i };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = pos(e),
    crop = state.crops[drag.i],
    b = activeLayout().panels[drag.i];
  crop.x = clamp(crop.x + (p.x - drag.x) / b.w, -1.5, 1.5);
  crop.y = clamp(crop.y + (p.y - drag.y) / b.h, -1.5, 1.5);
  drag = p;
  render();
});
canvas.addEventListener("pointerup", () => (drag = null));
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    state.crops[state.selected].zoom = clamp(
      state.crops[state.selected].zoom + (e.deltaY < 0 ? 0.08 : -0.08),
      1,
      3,
    );
    sync();
    render();
  },
  { passive: false },
);
function sync() {
  const z = state.crops[state.selected].zoom;
  document.querySelector("#zoom").value = z;
  document.querySelector("#zoomOut").value = z.toFixed(2) + "×";
  document.querySelector("#ratio").textContent = SIZES[state.size].label;
}
function setLayout(k) {
  state.layout = k;
  state.crops = activeLayout().panels.map((_, i) => {
    const crop = state.crops[i];
    if (crop) return crop;
    return { photo: state.varyPanels && state.photos.length ? i % state.photos.length : 0, x: 0, y: 0, zoom: 1, rotate: 0, flip: false };
  });
  document
    .querySelectorAll("#layouts button")
    .forEach((b) => b.classList.toggle("active", b.dataset.key === k));
  render();
}
function setLook(k) {
  const p = LOOKS[k];
  Object.assign(state, {
    grade: p.grade,
    lettering: p.lettering,
    decor: p.decor,
    look: k,
  });
  document
    .querySelectorAll(".look")
    .forEach((b) => b.classList.toggle("active", b.dataset.key === k));
  syncInputs();
  render();
}
function syncInputs() {
  for (const [id, key] of [
    ["grade", "grade"],
    ["lettering", "lettering"],
    ["decor", "decor"],
    ["caption", "caption"],
    ["hue", "hue"],
    ["saturation", "saturation"],
    ["contrast", "contrast"],
    ["warmth", "warmth"],
    ["vignette", "vignette"],
    ["capSize", "capSize"],
    ["spacing", "spacing"],
    ["outline", "outline"],
    ["shadow", "shadow"],
    ["capY", "capY"],
    ["size", "size"],
  ]) {
    const e = document.getElementById(id);
    if (e)
      e.type === "checkbox"
        ? (e.checked = !!state[key])
        : (e.value = state[key]);
  }
  sync();
}
const api = {
  fitCanvas,
  state,
  render,
  toast,
  setLayout,
  setLook,
  sync,
  syncInputs,
  loadPhoto: (file, s, done) =>
    loadPhoto(file).then((img) => {
      s.photos.push(img);
      fitPanels(s);
      refreshPhotoList(s);
      done();
      return img;
    }),
  loadSample: (i, s, done) =>
    loadSample(i).then((img) => {
      s.photos.push(img);
      refreshPhotoList(s);
      done();
      return img;
    }),
  fitPanels,
};
// Automated screenshots use this hook to verify PNG export sizes.
window.makefunExport = (sizeKey) =>
  renderPngDataUrl(sizeKey, state, (c,w,h,s)=>{drawPoster(c,w,h,s);drawLayers(c,w,h,s.layers)});

bindControls(api);
document.querySelector("#download").onclick = () =>
  exportPng(state.size, state, drawPoster, toast);
window.addEventListener("resize", fitCanvas);
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input,select,textarea")) return;
  const c = state.crops[state.selected];
  if (e.key === "ArrowLeft") c.x -= 0.02;
  else if (e.key === "ArrowRight") c.x += 0.02;
  else if (e.key === "ArrowUp") c.y -= 0.02;
  else if (e.key === "ArrowDown") c.y += 0.02;
  else if (e.key === "+" || e.key === "=") c.zoom = clamp(c.zoom + 0.08, 1, 3);
  else if (e.key === "-") c.zoom = clamp(c.zoom - 0.08, 1, 3);
  else return;
  e.preventDefault();
  sync();
  render();
});
setLayout(state.layout);
syncInputs();
fitCanvas();
(async () => {
  const samples = [0, 1, 2, 3];
  const loaded = await Promise.all(samples.map((i) => api.loadSample(i, state, () => {}).catch(() => null)));
  const valid = loaded.filter(Boolean);
  state.crops = valid.map((img, i) => ({
    photo: i,
    x: [0, -0.08, 0.08][i] ?? 0,
    y: [0, -0.07, 0.08][i] ?? 0,
    zoom: [1, 1.08, 1.12][i] ?? 1,
    rotate: 0,
    flip: false,
  }));
  refreshPhotoList(state);
  render();
})();
