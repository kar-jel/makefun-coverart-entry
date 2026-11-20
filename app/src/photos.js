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
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img._label = SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length].label;
      const frame = SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length];
      img._samplePosition = frame.position || [0.5, 0.5];
      resolve(img);
    };
    img.onerror = reject;
    img.src = SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length].src;
  });
}
export const SAMPLE_PHOTOS = [
  { src: "samples/boulevard.jpg", label: "Boulevard · wide" },
  { src: "samples/pier.jpg", label: "Pier · coast" },
  { src: "samples/boulevard.jpg", label: "Boulevard · detail", position: [0.68, 0.5] },
  { src: "samples/pier.jpg", label: "Pier · horizon", position: [0.5, 0.33] },
  { src: "samples/boulevard.jpg", label: "Boulevard · lights", position: [0.34, 0.68] },
  { src: "samples/pier.jpg", label: "Pier · sunset", position: [0.72, 0.58] },
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
