import { LAYOUTS, GRADES, LETTERING, SIZES } from "./state.js";
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function coverImage(ctx, img, x, y, w, h, c) {
  if (!img) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((c.rotate * Math.PI) / 180);
  const sw =
      Math.abs(Math.cos((c.rotate * Math.PI) / 180)) * w +
      Math.abs(Math.sin((c.rotate * Math.PI) / 180)) * h,
    sh =
      Math.abs(Math.sin((c.rotate * Math.PI) / 180)) * w +
      Math.abs(Math.cos((c.rotate * Math.PI) / 180)) * h,
    scale = Math.max(sw / img.width, sh / img.height) * c.zoom;
  ctx.scale((c.flip ? -1 : 1) * scale, scale);
  ctx.drawImage(
    img,
    -img.width / 2 + c.x * img.width * 0.38,
    -img.height / 2 + c.y * img.height * 0.38,
  );
  ctx.restore();
}
export function drawGrade(ctx, x, y, w, h, state) {
  const g = GRADES[state.grade];
  if (g.tint) {
    ctx.globalCompositeOperation = "color";
    const ramp = ctx.createLinearGradient(x, y+h, x+w, y);
    ramp.addColorStop(0, "#29105f"); ramp.addColorStop(.48, "#122e55"); ramp.addColorStop(1, "#ff4bb4");
    ctx.fillStyle = ramp; ctx.fillRect(x,y,w,h);
    ctx.globalCompositeOperation = "screen";
    const rim=ctx.createLinearGradient(0,y,0,y+h*.18); rim.addColorStop(0,"rgba(74,245,255,.34)");rim.addColorStop(1,"transparent");ctx.fillStyle=rim;ctx.fillRect(x,y,w,h*.18);
    ctx.globalCompositeOperation="source-over";
  }
  ctx.save();
  ctx.fillStyle = `hsla(${g.hue + state.hue},90%,55%,.13)`;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "soft-light";
  const grd = ctx.createLinearGradient(x, y, x + w, y + h);
  grd.addColorStop(0, `rgba(255,${160 + state.warmth},70,.38)`);
  grd.addColorStop(0.48, "rgba(244,74,134,.12)");
  grd.addColorStop(1, "rgba(30,36,115,.38)");
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "source-over";
  const v = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    Math.min(w, h) * 0.26,
    x + w / 2,
    y + h / 2,
    Math.max(w, h) * 0.72,
  );
  v.addColorStop(0, "transparent");
  v.addColorStop(
    1,
    `rgba(7,5,25,${Math.min(0.8, g.vignette + state.vignette / 200)})`,
  );
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
export function drawDecoration(ctx, x, y, w, h) {
  ctx.save();
  ctx.globalCompositeOperation="screen";
  const bloom=ctx.createRadialGradient(x+w*.76,y+h*.18,0,x+w*.76,y+h*.18,h*.55);
  bloom.addColorStop(0,"rgba(255,55,184,.28)"); bloom.addColorStop(1,"rgba(36,220,255,0)");
  ctx.fillStyle=bloom; ctx.fillRect(x,y,w,h*.44);
  ctx.globalCompositeOperation="source-over";
  ctx.globalAlpha = 0.92;
  const sun = ctx.createLinearGradient(0, y + h * 0.1, 0, y + h * 0.55);
  sun.addColorStop(0, "#ffe780");
  sun.addColorStop(1, "#ff5182");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.30, h * 0.19, Math.PI, 0);
  ctx.lineTo(x+w*.97,y+h*.30); ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.30, h * 0.19, Math.PI, 0);
  ctx.lineTo(x+w*.97,y+h*.30); ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "rgba(71,24,72,.38)";
  for (let i = 0; i < 7; i++)
    ctx.fillRect(x + w * 0.58, y + h * (0.31 + i * 0.045), w * 0.4, h * 0.018);
  ctx.restore();
  ctx.fillStyle = "rgba(17,16,34,.68)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.83);
  for (let i = 0; i <= 8; i++) {
    const xx = x + (i * w) / 8;
    ctx.lineTo(xx, y + h * (0.72 + Math.sin(i * 4) * 0.06));
    ctx.lineTo(xx, y + h * 0.88);
  }
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 7; i++) {
    const bx = x + w * (0.08 + i * 0.13),
      bh = h * (0.08 + (i % 3) * 0.035);
    ctx.fillStyle = "rgba(18,16,39,.82)";
    ctx.fillRect(bx, y + h * 0.81 - bh, w * 0.065, bh);
    for (let q = 0; q < 4; q++) {
      ctx.fillStyle = i % 2 ? "#ffc45c" : "#50dce0";
      ctx.globalAlpha = 0.7;
      ctx.fillRect(
        bx + w * 0.012 + q * w * 0.014,
        y + h * 0.82 - bh + (q % 2) * h * 0.02,
        w * 0.006,
        h * 0.012,
      );
    }
  }
  ctx.restore();
}
export function drawLockup(ctx, w, h) {
  ctx.save();
  ctx.font = `${h * 0.064}px Anton,Impact,sans-serif`;
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  ctx.lineWidth = h * 0.004;
  ctx.strokeStyle = "#151324";
  ctx.fillStyle = "#fff4dc";
  ctx.shadowColor = "#ff4e8d";
  ctx.shadowBlur = h * 0.015;
  ctx.strokeText("GTA", w * 0.055, h * 0.105);
  ctx.fillText("GTA", w * 0.055, h * 0.105);
  const x = w * 0.225,
    y = h * 0.108,
    size = h * 0.047;
  ctx.font = `bold ${size}px Arial`;
  ctx.fillStyle = "#f9c947";
  ctx.fillText("6", x, y);
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${h * 0.012}px Arial`;
  ctx.fillText("VICE CITY", w * 0.06, h * 0.126);
  ctx.restore();
}
export function drawCaption(ctx, w, h, s) {
  ctx.save();
  const y = (h * s.capY) / 100,
    style = LETTERING[s.lettering],
    text = (s.caption || "YOUR STORY").toUpperCase(),
    max = w * 0.86,
    size = (h * s.capSize) / 100;
  ctx.font = `${size}px Anton,Impact,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.shadowColor = style.mode === "neon" ? "#ff2ca4" : "#09091a";
  ctx.shadowBlur = (h * s.shadow) / 100;
  ctx.shadowOffsetY = h * 0.008;
  let spacing = (h * s.spacing) / 1000;
  const chars = [...text];
  let measured = ctx.measureText(text).width + spacing * (chars.length - 1),
    scale = Math.min(1, max / measured);
  ctx.translate(w / 2, y);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -y);
  if (style.mode === "stacked") {
    ctx.strokeStyle = "#211329";
    ctx.lineWidth = (h * s.outline) / 100;
    ctx.strokeText(text, w / 2, y + size * 0.07);
    ctx.fillStyle = "#fff8df";
    ctx.fillText(text, w / 2, y);
  } else if (style.mode === "gradient") {
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    g.addColorStop(0, "#fff8cf");
    g.addColorStop(0.45, "#ffdc72");
    g.addColorStop(1, "#ff4588");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#341a3a";
    ctx.lineWidth = (h * s.outline) / 130;
    ctx.strokeText(text, w / 2, y);
    ctx.fillText(text, w / 2, y);
  } else {
    ctx.fillStyle = "#9bfaff";
    ctx.strokeStyle = "#ff4cc6";
    ctx.lineWidth = (h * s.outline) / 140;
    ctx.shadowColor = "#26d9ff";
    ctx.shadowBlur = h * 0.035;
    ctx.strokeText(text, w / 2, y);
    ctx.fillText(text, w / 2, y);
  }
  ctx.restore();
  return y;
}
export function drawBottomBar(ctx, w, h, y) {
  ctx.save();
  const bh = h * 0.045;
  ctx.fillStyle = "rgba(12,12,24,.86)";
  ctx.fillRect(0, h - bh, w, bh);
  ctx.fillStyle = "#ffbe58";
  ctx.fillRect(0, h - bh, w, h * 0.002);
  ctx.fillStyle = "#e9e3df";
  ctx.font = `700 ${h * 0.012}px Arial`;
  ctx.textAlign = "left";
  ctx.fillText(
    "VICE//FRAME  ·  ORIGINAL CITY STORIES",
    w * 0.04,
    h - bh * 0.38,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffdc8b";
  ctx.fillText("V-17  ◆  MATURE", w * 0.96, h - bh * 0.38);
  ctx.strokeStyle = "#ffdc8b";
  ctx.lineWidth = h * 0.001;
  ctx.strokeRect(w * 0.875, h - bh * 0.82, w * 0.09, bh * 0.62);
  ctx.restore();
}
export function drawPanel(ctx, w, h, state, index) {
  const p = LAYOUTS[state.layout].panels[index],
    x = p.x * w,
    y = p.y * h,
    pw = p.w * w,
    ph = p.h * h,
    c = state.crops[index] || { photo: 0, x: 0, y: 0, zoom: 1, rotate: 0 };
  ctx.save();
  ctx.fillStyle = "#fff0ce";
  ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
  coverImage(ctx, state.photos[c.photo] || state.photos[0], x, y, pw, ph, c);
  ctx.filter = `hue-rotate(${state.hue}deg) saturate(${state.saturation}%) contrast(${state.contrast}%)`;
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = `rgba(255,${150 + state.warmth},95,.12)`;
  ctx.fillRect(x, y, pw, ph);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  drawGrade(ctx, x, y, pw, ph, state);
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,pw,ph); ctx.clip();
  // Chromatic fringe is confined to the panel edges.
  ctx.globalAlpha=.22; ctx.globalCompositeOperation="screen";
  ctx.fillStyle="#ff245e"; ctx.fillRect(x,y,pw,Math.max(2,h*.002));
  ctx.fillStyle="#28efff"; ctx.fillRect(x,y+ph-Math.max(2,h*.002),pw,Math.max(2,h*.002));
  ctx.globalAlpha=.08; ctx.fillStyle="#65efff";
  for(let sy=y;sy<y+ph;sy+=Math.max(3,h*.004)) ctx.fillRect(x,sy,pw,Math.max(1,h*.0006));
  ctx.restore();
  ctx.strokeStyle = "rgba(255,244,218,.68)";
  ctx.lineWidth = Math.max(1, h * 0.0018);
  ctx.strokeRect(x, y, pw, ph);
  ctx.restore();
}
export function drawPoster(ctx, w, h, state) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#171124";
  ctx.fillRect(0, 0, w, h);
  const lay = LAYOUTS[state.layout];
  for (let i = 0; i < lay.panels.length; i++) drawPanel(ctx, w, h, state, i);
  if (state.decor) drawDecoration(ctx, 0, 0, w, h);
  drawLockup(ctx, w, h);
  const y = drawCaption(ctx, w, h, state);
  drawBottomBar(ctx, w, h, y);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.24)";
  ctx.lineWidth = Math.max(1, h * 0.001);
  ctx.strokeRect(w * 0.012, h * 0.012, w * 0.976, h * 0.976);
  ctx.restore();
}
export { SIZES };
