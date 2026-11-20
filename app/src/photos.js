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
      img._label = index ? "Pier sample" : "Boulevard sample";
      resolve(img);
    };
    img.onerror = reject;
    img.src = `samples/${index ? "pier" : "boulevard"}.jpg`;
  });
}
export function fitPanels(state) {
  if (state.photos.length === 1) state.crops.forEach((c) => (c.photo = 0));
  else
    state.crops.forEach(
      (c) =>
        (c.photo = Math.min(c.photo, Math.max(0, state.photos.length - 1))),
    );
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
