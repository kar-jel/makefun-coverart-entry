export function loadPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      img._objectUrl = url;
      img._label = file.name;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = url;
  });
}
export function loadSample(index = 0) {
  const frame = SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length];
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img._label = frame.label;
      img._samplePosition = frame.position || [0.5, 0.5];
      img._sampleZoom = frame.zoom || 1;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Could not load ${frame.src}`));
    img.src = frame.src;
  });
}
export const SAMPLE_PHOTOS = [
  { src: "samples/boulevard.jpg", label: "Boulevard · wide", position: [0.5, 0.5], zoom: 1 },
  { src: "samples/boulevard.jpg", label: "Boulevard · detail", position: [0.72, 0.48], zoom: 1.45 },
  { src: "samples/pier.jpg", label: "Pier · coast", position: [0.5, 0.6], zoom: 1 },
  { src: "samples/pier.jpg", label: "Pier · horizon", position: [0.52, 0.3], zoom: 1.35 },
];
export function fitPanels(state) {
  if (state.varyPanels === false || state.photos.length === 1) state.crops.forEach((c) => (c.photo = 0));
  else
    state.crops.forEach((c, i) => {
      if (c.photo >= state.photos.length) c.photo = i % state.photos.length;
    });
}
export function resetCrop(c) {
  Object.assign(c, { x: 0, y: 0, zoom: 1, rotate: 0, flip: false });
}

export function refreshPhotoList(state) {
  const list = document.querySelector("#photoList");
  list.replaceChildren();
  state.photos.forEach((photo, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "photo-chip";
    chip.dataset.photo = index;
    chip.textContent = `${index + 1} · ${(photo._label || `Photo ${index + 1}`).slice(0, 18)}`;
    const selected = state.crops[state.selected]?.photo ?? 0;
    chip.classList.toggle("active", selected === index);
    list.append(chip);
  });
}
