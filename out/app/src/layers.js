// Canvas rendering and interaction helpers for editable poster layers.

// Create the standard editable lockup and decorative starter layers.
export function defaultLayers() {
  return [
    { name: "VICE FRAME", type: "text", text: "VICE FRAME", x: 0.5, y: 0.115, rotation: 0,
      opacity: 1, scale: 1, fill: "#ffffff", outline: "#100d20", fontKey: "Anton",
      visible: true, locked: true, fontSize: 90 },
    { name: "Caption", type: "text", text: "LIVE WITHOUT LIMITS", x: 0.5, y: 0.87,
      rotation: 0, opacity: 1, scale: 1, fill: "#fff8df", outline: "#211329",
      fontKey: "Anton", visible: true, locked: false, fontSize: 70 },
    { name: "Credit", type: "text", text: "ORIGINAL CITY STORIES", x: 0.5, y: 0.165,
      rotation: 0, opacity: 0.9, scale: 1, fill: "#f7f2ff", outline: "transparent",
      fontKey: "Anton", visible: true, locked: false, fontSize: 20 },
    { name: "COMING SOON", type: "text", text: "COMING SOON", x: 0.5, y: 0.78,
      rotation: 0, opacity: 1, scale: 1, fill: "#ffdc72", outline: "#211329",
      fontKey: "Anton", visible: false, locked: false, fontSize: 26 },
    { name: "Banner", type: "shape", shape: "banner", x: 0.5, y: 0.5,
      rotation: 0, opacity: 0.8, scale: 1, fill: "#16102b", outline: "#ff4f91",
      fontKey: "Anton", visible: false, locked: false },
    { name: "Badge", type: "shape", shape: "badge", x: 0.82, y: 0.12,
      rotation: 0, opacity: 1, scale: 1, fill: "#171124", outline: "#55edff",
      fontKey: "Anton", visible: false, locked: false },
    { name: "Star", type: "shape", shape: "star", x: 0.9, y: 0.7,
      rotation: 0, opacity: 1, scale: 1, fill: "#ffdc72", outline: "#ffffff",
      fontKey: "Anton", visible: false, locked: false },
    { name: "Stripe", type: "shape", shape: "stripe", x: 0.5, y: 0.6,
      rotation: -8, opacity: 0.65, scale: 1, fill: "#ff4f91", outline: "transparent",
      fontKey: "Anton", visible: false, locked: false },
  ];
}

// Add a normalized layer and return the inserted layer object.
export function addLayer(layers, layer = {}) {
  const defaults = { type: "text", x: 0.5, y: 0.5, rotation: 0, opacity: 1, scale: 1,
    fill: "#ffffff", outline: "transparent", fontKey: "Anton", visible: true, locked: false };
  const created = { ...defaults, ...layer };
  layers.push(created);
  return created;
}

// Remove an unlocked layer by index and return the removed layer, if any.
export function removeLayer(layers, index) {
  if (!layers[index] || layers[index].locked) return null;
  return layers.splice(index, 1)[0] || null;
}

// Move an unlocked layer by normalized coordinates.
export function move(layers, index, x, y) {
  const layer = layers[index];
  if (!layer || layer.locked) return false;
  layer.x = Math.max(0, Math.min(1, Number(x) || 0));
  layer.y = Math.max(0, Math.min(1, Number(y) || 0));
  return true;
}

// Wrap text into centered lines using the current canvas font metrics.
function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Paint text with optional letter spacing and a separate outline pass.
function drawText(ctx, layer, width, height) {
  const size = Math.max(1, Number(layer.fontSize) || height * 0.05);
  const spacing = Number.isFinite(Number(layer.letterSpacing)) ? Number(layer.letterSpacing) : 0;
  const maxWidth = Math.max(1, (Number(layer.maxWidth) || 0.8) * width);
  ctx.font = `${layer.fontWeight || "400"} ${size}px ${layer.fontKey || "Anton"}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const lines = wrapText(ctx, layer.text, maxWidth);
  const lineHeight = size * (Number(layer.lineHeight) || 1.1);
  const firstY = -((lines.length - 1) * lineHeight) / 2;
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index];
    const y = firstY + index * lineHeight;
    if (spacing > 0 && typeof ctx.letterSpacing === "string") ctx.letterSpacing = `${spacing}px`;
    ctx.lineWidth = Math.max(0, Number(layer.outlineWidth) || size * 0.035);
    if (layer.outline && layer.outline !== "transparent" && ctx.lineWidth > 0) {
      ctx.strokeStyle = layer.outline;
      ctx.strokeText(text, 0, y, maxWidth);
    }
    ctx.fillStyle = layer.fill || "#ffffff";
    ctx.fillText(text, 0, y, maxWidth);
  }
}

// Build a polygon path for a five-point star.
function starPath(ctx, radius) {
  for (let point = 0; point < 10; point += 1) {
    const r = point % 2 ? radius * 0.45 : radius;
    const angle = point * Math.PI / 5 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (point === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Draw one supported geometric shape centered on the origin.
function drawShape(ctx, layer, width, height) {
  const radius = height * 0.08;
  ctx.beginPath();
  if (layer.shape === "badge") {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  } else if (layer.shape === "star") {
    starPath(ctx, radius);
  } else if (layer.shape === "stripe") {
    ctx.rect(-width * 0.48, -height * 0.025, width * 0.96, height * 0.05);
  } else {
    ctx.moveTo(-width * 0.42, -height * 0.065);
    ctx.lineTo(width * 0.42, -height * 0.065);
    ctx.lineTo(width * 0.48, 0);
    ctx.lineTo(width * 0.42, height * 0.065);
    ctx.lineTo(-width * 0.42, height * 0.065);
    ctx.lineTo(-width * 0.48, 0);
    ctx.closePath();
  }
  ctx.fillStyle = layer.fill || "#ffffff";
  ctx.fill();
  if (layer.outline && layer.outline !== "transparent") {
    ctx.strokeStyle = layer.outline;
    ctx.lineWidth = Math.max(1, height * 0.003);
    ctx.stroke();
  }
}

// Render all visible layers with normalized placement and transforms.
export function drawLayers(ctx, width, height, layers = []) {
  for (const layer of layers) {
    if (!layer || layer.visible === false) continue;
    ctx.save();
    ctx.translate((Number(layer.x) || 0) * width, (Number(layer.y) || 0) * height);
    ctx.rotate((Number(layer.rotation) || 0) * Math.PI / 180);
    ctx.globalAlpha = Math.max(0, Math.min(1, Number(layer.opacity ?? 1)));
    const scale = Math.max(0.01, Number(layer.scale) || 1);
    ctx.scale(scale, scale);
    if (layer.type === "text") drawText(ctx, layer, width, height);
    else if (layer.type === "shape") drawShape(ctx, layer, width, height);
    ctx.restore();
  }
}

// Return the topmost unlocked visible layer hit by normalized coordinates.
export function hitTest(x, y, width, height, layers = []) {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (!layer || !layer.visible || layer.locked) continue;
    const dx = x * width - layer.x * width;
    const dy = y * height - layer.y * height;
    const angle = -(Number(layer.rotation) || 0) * Math.PI / 180;
    const scale = Math.max(0.01, Number(layer.scale) || 1);
    const localX = (dx * Math.cos(angle) - dy * Math.sin(angle)) / scale;
    const localY = (dx * Math.sin(angle) + dy * Math.cos(angle)) / scale;
    const halfWidth = layer.type === "text" ? (Number(layer.maxWidth) || 0.8) * width / 2 : width * 0.48;
    const halfHeight = layer.type === "text" ? (Number(layer.fontSize) || height * 0.05) * 0.7 : height * 0.09;
    if (Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight) return index;
  }
  return -1;
}
