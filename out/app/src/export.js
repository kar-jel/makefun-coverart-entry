import { SIZES } from "./state.js";
export function exportPng(sizeKey, state, draw, toast) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  draw(ctx, canvas.width, canvas.height, state);
  canvas.toBlob((blob) => {
    if (!blob) {
      toast("PNG export failed");
      return;
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `vice-frame-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast(`Downloaded ${size.width} × ${size.height} PNG`);
  }, "image/png");
}

export function renderPngDataUrl(sizeKey, state, draw) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  draw(ctx, canvas.width, canvas.height, state);
  return canvas.toDataURL("image/png");
}
