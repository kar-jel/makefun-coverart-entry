// Apply modular pixel filters and cache their results in a bounded LRU.
// Internal LRU storage and maximum entry count.
const CACHE_LIMIT = 32;
const cache = new Map();

// Clamp channel values while converting invalid numbers to black.
export function clampByte(value) {
  return Math.max(0, Math.min(255, Number.isFinite(value) ? value : 0));
}

// Calculate perceptual luminance from RGB channels.
export function luma(red, green, blue) {
  return 0.299 * red + 0.587 * green + 0.114 * blue;
}

// Validate an option and clamp it to a safe range.
function numberOption(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

// Parse a six-digit hex colour or return a reliable fallback.
function parseColor(value, fallback) {
  const match = /^#?([\da-f]{6})$/i.exec(String(value || ""));
  const hex = match ? match[1] : fallback;
  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
}

// Serialize option objects consistently, including nested objects.
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

// Hash text with FNV-1a for compact cache keys.
function hash(text) {
  let result = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    result = Math.imul(result ^ text.charCodeAt(index), 16777619);
  }
  return (result >>> 0).toString(16);
}

// Build a content-and-settings key for a pixel buffer.
export function cacheKey(data, options = {}) {
  let pixels = 2166136261;
  for (let index = 0; index < data.data.length; index += 97) {
    pixels = Math.imul(pixels ^ data.data[index], 16777619);
  }
  return `${data.width}x${data.height}:${(pixels >>> 0).toString(16)}:${hash(stable(options))}`;
}

// Empty the pixel cache and reset hit and miss counters.
export function clearCache() {
  cache.clear();
  cache.hits = 0;
  cache.misses = 0;
}

// Return cache size and hit/miss metrics.
export function cacheStats() {
  return { size: cache.size, limit: CACHE_LIMIT, hits: cache.hits || 0, misses: cache.misses || 0 };
}

// Run an operation with LRU lookup and store a copy of its output.
function cached(data, options, operation) {
  const key = cacheKey(data, options);
  if (cache.has(key)) {
    const pixels = cache.get(key);
    cache.delete(key);
    cache.set(key, pixels);
    cache.hits = (cache.hits || 0) + 1;
    data.data.set(pixels);
    return data;
  }
  cache.misses = (cache.misses || 0) + 1;
  operation(data);
  cache.set(key, new Uint8ClampedArray(data.data));
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return data;
}

// Apply hue, saturation, contrast, warmth, lift, and gain adjustments.
export function applyGrade(data, settings = {}) {
  const hue = numberOption(settings.hue, 0, -360, 360);
  const saturation = numberOption(settings.saturation, 1, 0, 4);
  const contrast = numberOption(settings.contrast, 1, 0, 4);
  const warmth = numberOption(settings.warmth, 0, -255, 255);
  const lift = numberOption(settings.lift, 0, -255, 255);
  const gain = numberOption(settings.gain, 1, 0, 4);
  return cached(data, { hue, saturation, contrast, warmth, lift, gain }, (image) => {
    const pixels = image.data;
    const angle = hue * Math.PI / 180;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const y = luma(red, green, blue);
      const u = -0.147 * red - 0.289 * green + 0.436 * blue;
      const v = 0.615 * red - 0.515 * green - 0.1 * blue;
      const rotatedU = (u * cosine - v * sine) * saturation;
      const rotatedV = (u * sine + v * cosine) * saturation;
      const base = (y - 128) * contrast + 128 + lift;
      pixels[index] = clampByte((base + 1.14 * rotatedV) * gain);
      pixels[index + 1] = clampByte((base - 0.395 * rotatedU - 0.581 * rotatedV + warmth) * gain);
      pixels[index + 2] = clampByte((base + 2.033 * rotatedU) * gain);
    }
  });
}

// Blend a dark-to-light duotone over each source pixel.
export function applyDuotone(data, settings = {}) {
  const dark = parseColor(settings.dark, "16102b");
  const light = parseColor(settings.light, "ffd27a");
  const amount = numberOption(settings.amount, 1, 0, 1);
  return cached(data, { dark, light, amount }, (image) => {
    for (let index = 0; index < image.data.length; index += 4) {
      const tone = luma(image.data[index], image.data[index + 1], image.data[index + 2]) / 255;
      for (let channel = 0; channel < 3; channel += 1) {
        const target = dark[channel] + (light[channel] - dark[channel]) * tone;
        image.data[index + channel] = clampByte(image.data[index + channel] * (1 - amount) + target * amount);
      }
    }
  });
}

// Quantize each colour channel to a bounded number of levels.
export function applyPosterize(data, settings = {}) {
  const levels = Math.round(numberOption(settings.levels, 6, 2, 32));
  return cached(data, { levels }, (image) => {
    const step = 255 / (levels - 1);
    for (let index = 0; index < image.data.length; index += 4) {
      for (let channel = 0; channel < 3; channel += 1) {
        image.data[index + channel] = clampByte(Math.round(image.data[index + channel] / step) * step);
      }
    }
  });
}

// Render luminance-driven monochrome halftone dots.
export function applyHalftone(data, settings = {}) {
  const cell = Math.round(numberOption(settings.cell, 8, 2, 64));
  const angle = numberOption(settings.angle, 0, -360, 360) * Math.PI / 180;
  return cached(data, { cell, angle }, (image) => {
    const source = new Uint8ClampedArray(image.data);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let top = 0; top < image.height; top += cell) {
      for (let left = 0; left < image.width; left += cell) {
        const cx = Math.min(image.width - 1, left + Math.floor(cell / 2));
        const cy = Math.min(image.height - 1, top + Math.floor(cell / 2));
        const sample = (cy * image.width + cx) * 4;
        const radius = cell * 0.48 * Math.sqrt(1 - luma(source[sample], source[sample + 1], source[sample + 2]) / 255);
        for (let y = top; y < Math.min(image.height, top + cell); y += 1) {
          for (let x = left; x < Math.min(image.width, left + cell); x += 1) {
            const dx = x - cx;
            const dy = y - cy;
            const rx = dx * cosine - dy * sine;
            const ry = dx * sine + dy * cosine;
            if (rx * rx + ry * ry > radius * radius) {
              const pixel = (y * image.width + x) * 4;
              image.data[pixel] = 255;
              image.data[pixel + 1] = 255;
              image.data[pixel + 2] = 255;
            }
          }
        }
      }
    }
  });
}

// Darken regularly spaced horizontal scanline rows.
export function applyScanlines(data, settings = {}) {
  const period = Math.round(numberOption(settings.period, 3, 1, 64));
  const alpha = numberOption(settings.alpha, 0.2, 0, 1);
  return cached(data, { period, alpha }, (image) => {
    for (let y = 0; y < image.height; y += period) {
      for (let x = 0; x < image.width; x += 1) {
        const index = (y * image.width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          image.data[index + channel] = clampByte(image.data[index + channel] * (1 - alpha));
        }
      }
    }
  });
}

// Add repeatable seeded luminance noise.
export function applyGrain(data, settings = {}) {
  const amount = numberOption(settings.amount, 12, 0, 100);
  const seed = Math.floor(numberOption(settings.seed, 1, 0, 0xffffffff)) >>> 0;
  return cached(data, { amount, seed }, (image) => {
    let random = seed;
    for (let index = 0; index < image.data.length; index += 4) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const noise = ((random >>> 24) / 255 - 0.5) * amount;
      for (let channel = 0; channel < 3; channel += 1) {
        image.data[index + channel] = clampByte(image.data[index + channel] + noise);
      }
    }
  });
}

// Offset red and blue channels in opposite horizontal directions.
export function applyChromatic(data, settings = {}) {
  const offset = Math.round(numberOption(settings.offset, 2, 0, 32));
  return cached(data, { offset }, (image) => {
    const source = new Uint8ClampedArray(image.data);
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const pixel = (y * image.width + x) * 4;
        const left = (y * image.width + Math.max(0, x - offset)) * 4;
        const right = (y * image.width + Math.min(image.width - 1, x + offset)) * 4;
        image.data[pixel] = source[left];
        image.data[pixel + 2] = source[right + 2];
      }
    }
  });
}

// Apply a radial edge darkening effect.
export function applyVignette(data, settings = {}) {
  const amount = numberOption(settings.amount, 0.5, 0, 1);
  return cached(data, { amount }, (image) => {
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const radius = Math.hypot((x - image.width / 2) / (image.width / 2), (y - image.height / 2) / (image.height / 2));
        const multiplier = Math.max(0, 1 - amount * Math.max(0, radius - 0.25));
        const index = (y * image.width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          image.data[index + channel] = clampByte(image.data[index + channel] * multiplier);
        }
      }
    }
  });
}

// Blend a coloured light leak fading from the selected side.
export function applyLightLeak(data, settings = {}) {
  const rgb = parseColor(settings.colour, "ff5588");
  const amount = numberOption(settings.amount, 0.3, 0, 1);
  const from = settings.from === "right" ? "right" : "left";
  return cached(data, { rgb, amount, from }, (image) => {
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const horizontal = from === "right" ? image.width - 1 - x : x;
        const blend = horizontal / Math.max(1, image.width) * (1 - y / Math.max(1, image.height)) * amount;
        const index = (y * image.width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          image.data[index + channel] = clampByte(image.data[index + channel] * (1 - blend) + rgb[channel] * blend);
        }
      }
    }
  });
}

const filters = {
  grade: applyGrade,
  duotone: applyDuotone,
  posterize: applyPosterize,
  halftone: applyHalftone,
  scanlines: applyScanlines,
  grain: applyGrain,
  chromatic: applyChromatic,
  vignette: applyVignette,
  lightLeak: applyLightLeak,
};

// Execute filters in order and reject unsupported stage names.
export function runPipeline(data, stages = []) {
  for (const stage of stages) {
    const filter = filters[stage.name];
    if (!filter) throw new Error(`Unknown filter: ${stage.name}`);
    data = filter(data, stage.options || {});
  }
  return data;
}
