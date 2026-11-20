import { LAYOUTS, GRADES, LETTERING, SIZES } from "./state.js";
import { runPipeline } from "./filters.js";
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
const inkCache = new WeakMap();
function posterizePanel(ctx, x, y, w, h, state, img, crop) {
  if (!state.ink || !img) return;
  const levels=Math.max(2,Math.round(state.inkLevels||9)); let map=inkCache.get(img); if(!map)inkCache.set(img,map=new Map());
  const key=[crop.x,crop.y,crop.zoom,crop.rotate,crop.flip,state.grade,state.hue,state.saturation,state.contrast,state.warmth,state.vignette,levels,w,h].join(":"); let canvas=map.get(key);
  if(!canvas){canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(w));canvas.height=Math.max(1,Math.round(h));const q=canvas.getContext("2d",{willReadFrequently:true});coverImage(q,img,0,0,canvas.width,canvas.height,crop);q.filter=`hue-rotate(${state.hue}deg) saturate(${state.saturation}%) contrast(${state.contrast}%)`;q.globalCompositeOperation="source-atop";q.fillStyle=`rgba(255,${150+state.warmth},95,.12)`;q.fillRect(0,0,canvas.width,canvas.height);q.filter="none";q.globalCompositeOperation="source-over";drawGrade(q,0,0,canvas.width,canvas.height,state);const im=q.getImageData(0,0,canvas.width,canvas.height),step=255/(levels-1);for(let i=0;i<im.data.length;i+=4)for(let k=0;k<3;k++)im.data[i+k]=Math.round(im.data[i+k]/step)*step;q.putImageData(im,0,0);runPipeline(q.getImageData(0,0,canvas.width,canvas.height),[{name:"halftone",options:{cell:9,angle:18}}]);const dots=q.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<dots.data.length;i+=4){if(dots.data[i]===255&&dots.data[i+1]===255&&dots.data[i+2]===255){dots.data[i]=im.data[i];dots.data[i+1]=im.data[i+1];dots.data[i+2]=im.data[i+2];}}q.putImageData(dots,0,0);map.set(key,canvas);if(map.size>8)map.delete(map.keys().next().value);}
  ctx.drawImage(canvas,x,y,w,h);
}
function drawInk(ctx,x,y,w,h,amount=70){if(!amount)return;const a=amount/100;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();const sw=Math.max(1,Math.round(w/2)),shalf=Math.max(1,Math.round(h/2)),c=document.createElement("canvas");c.width=sw;c.height=shalf;const q=c.getContext("2d",{willReadFrequently:true});q.drawImage(ctx.canvas,x,y,w,h,0,0,sw,shalf);const src=q.getImageData(0,0,sw,shalf),d=src.data,lum=new Float32Array(sw*shalf);for(let i=0;i<lum.length;i++)lum[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];const edges=q.createImageData(sw,shalf);for(let yy=1;yy<shalf-1;yy++)for(let xx=1;xx<sw-1;xx++){const i=yy*sw+xx,gx=-lum[i-sw-1]+lum[i-sw+1]-2*lum[i-1]+2*lum[i+1]-lum[i+sw-1]+lum[i+sw+1],gy=-lum[i-sw-1]-2*lum[i-sw]-lum[i-sw+1]+lum[i+sw-1]+2*lum[i+sw]+lum[i+sw+1],j=i*4;edges.data[j]=14;edges.data[j+1]=8;edges.data[j+2]=32;edges.data[j+3]=Math.hypot(gx,gy)>210?255:0;}q.putImageData(edges,0,0);ctx.globalAlpha=.55*a;ctx.drawImage(c,x,y,w,h);ctx.globalAlpha=1;ctx.globalCompositeOperation="screen";ctx.globalAlpha=.85*a;ctx.strokeStyle="#48efff";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x+w,y+1);ctx.moveTo(x+1,y);ctx.lineTo(x+1,y+h);ctx.stroke();ctx.globalCompositeOperation="multiply";ctx.globalAlpha=.5*a;const sh=ctx.createLinearGradient(0,y+h*.67,0,y+h);sh.addColorStop(0,"rgba(45,15,96,0)");sh.addColorStop(1,"rgba(45,15,96,.92)");ctx.fillStyle=sh;ctx.fillRect(x,y+h*.67,w,h*.33);ctx.restore();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;}
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
  // No city/UI silhouettes: preserve the source panel imagery.
  ctx.restore();
}
export function drawLockup(ctx, w, h, layout = "cover") {
  ctx.save();
  const top = h * 0.035, bottom = h * 0.225;
  if (layout === "single") {
    const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.31);
    scrim.addColorStop(0, "rgba(9,7,25,.94)");
    scrim.addColorStop(1, "rgba(9,7,25,0)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h * 0.31);
  }
  const blockW = w * 0.70, x = (w - blockW) / 2;
  const glow = ctx.createRadialGradient(w/2, h*.12, 0, w/2, h*.12, blockW*.6);
  glow.addColorStop(0, "rgba(255,36,165,.16)"); glow.addColorStop(1, "rgba(255,36,165,0)");
  ctx.fillStyle = glow; ctx.fillRect(x, top, blockW, bottom-top);
  const base = h * 0.115;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  const title = ctx.createLinearGradient(0, h*.045, 0, h*.145);
  title.addColorStop(0, "#ffffff"); title.addColorStop(.48, "#c8d0dc"); title.addColorStop(1, "#ff55c8");
  ctx.font = `${h*.105}px Anton,Impact,sans-serif`;
  ctx.lineWidth = h*.004; ctx.strokeStyle = "#100d20"; ctx.shadowColor="#ff3fc1"; ctx.shadowBlur=h*.006;
  ctx.strokeText("VICE FRAME", w/2, base);
  ctx.fillStyle=title; ctx.fillText("VICE FRAME", w/2, base);
  ctx.shadowBlur=0;
  const subY=h*.165;
  ctx.strokeStyle="#ff5bd1";ctx.lineWidth=h*.0012;ctx.beginPath();ctx.moveTo(w*.26,subY-h*.017);ctx.lineTo(w*.74,subY-h*.017);ctx.moveTo(w*.26,subY+h*.017);ctx.lineTo(w*.74,subY+h*.017);ctx.stroke();
  ctx.font=`${h*.023}px Anton,Impact,sans-serif`;ctx.fillStyle="#f7f2ff";ctx.letterSpacing="0px";ctx.fillText("ORIGINAL CITY STORIES",w/2,subY);
  const bx=w*.82, by=h*.075, bw=w*.105,bh=h*.12;
  ctx.beginPath();ctx.roundRect(bx,by,bw,bh,h*.018);ctx.fillStyle="rgba(18,12,35,.9)";ctx.fill();ctx.lineWidth=h*.003;ctx.strokeStyle="#55edff";ctx.stroke();
  ctx.font=`${h*.071}px Anton,Impact,sans-serif`;ctx.fillStyle=title;ctx.fillText("17",bx+bw/2,by+bh/2);
  ctx.restore();
}
export function drawCaption(ctx, w, h, s) {
  ctx.save();
  const y = clamp((h * s.capY) / 100, h * 0.70, h * 0.90),
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
    "VICE FRAME  ·  ORIGINAL CITY STORIES",
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
  const sourceCrop = state.crops[index] || { photo: 0, x: 0, y: 0, zoom: 1, rotate: 0 };
  const c = { ...sourceCrop, rotate: sourceCrop.rotate || 0, panelRotate: p.rotate || 0 };
  ctx.save();
  if (c.panelRotate) {
    ctx.save(); ctx.translate(x+pw/2,y+ph/2); ctx.rotate(c.panelRotate*Math.PI/180);
    ctx.fillStyle="#090d1b"; ctx.fillRect(-pw/2-2,-ph/2-2,pw+4,ph+4);
    if(photo) coverImage(ctx,photo,-pw/2,-ph/2,pw,ph,c);
    ctx.strokeStyle="rgba(73,238,255,.9)";ctx.lineWidth=Math.max(1,h*.002);ctx.strokeRect(-pw/2,-ph/2,pw,ph);ctx.restore();
    return;
  }
  // A continuous dark ground replaces white gutters; panels overlap as cutouts.
  ctx.fillStyle = "#090d1b";
  ctx.fillRect(x - 2, y - 2, pw + 4, ph + 4);
  const photo=state.photos[c.photo] || state.photos[0];
  if (state.ink) posterizePanel(ctx,x,y,pw,ph,state,photo,c); else coverImage(ctx,photo,x,y,pw,ph,c);
  if (!state.ink && photo) {
    const pixels = ctx.getImageData(x, y, pw, ph);
    runPipeline(pixels, [
      { name: "grade", options: {
        hue: state.hue + (GRADES[state.grade]?.hue || 0),
        saturation: state.saturation / 100 * (GRADES[state.grade]?.sat || 1),
        contrast: state.contrast / 100 * (GRADES[state.grade]?.contrast || 1),
        warmth: state.warmth + (GRADES[state.grade]?.warm || 0),
      } },
      { name: "vignette", options: { amount: state.vignette / 100 } },
    ]);
    ctx.putImageData(pixels, x, y);
  }
  if(state.ink) drawInk(ctx,x,y,pw,ph,state.ink);
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,pw,ph); ctx.clip();
  // Chromatic fringe is confined to the panel edges.
  ctx.globalAlpha=.22; ctx.globalCompositeOperation="screen";
  ctx.fillStyle="#ff245e"; ctx.fillRect(x,y,pw,Math.max(2,h*.002));
  ctx.fillStyle="#28efff"; ctx.fillRect(x,y+ph-Math.max(2,h*.002),pw,Math.max(2,h*.002));
  ctx.globalAlpha=.08; ctx.fillStyle="#65efff";
  for(let sy=y;sy<y+ph;sy+=Math.max(3,h*.004)) ctx.fillRect(x,sy,pw,Math.max(1,h*.0006));
  ctx.restore();
  ctx.strokeStyle = "rgba(73,238,255,.72)";
  ctx.lineWidth = Math.max(1, h * 0.0018);
  ctx.strokeRect(x, y, pw, ph);
  ctx.restore();
}
export function drawPoster(ctx, w, h, state) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#070b18";
  ctx.fillRect(0, 0, w, h);
  const atmosphere=ctx.createLinearGradient(0,0,w,h);
  atmosphere.addColorStop(0,"#10283d"); atmosphere.addColorStop(.42,"#102346"); atmosphere.addColorStop(.68,"#45163c"); atmosphere.addColorStop(1,"#f05a2a");
  ctx.globalAlpha=.65; ctx.fillStyle=atmosphere; ctx.fillRect(0,0,w,h); ctx.globalAlpha=1;
  const lay = LAYOUTS[state.layout];
  for (let i = 0; i < lay.panels.length; i++) drawPanel(ctx, w, h, state, i);
  // Decorative sun artwork remains an option; avoid covering the photos in the default collage.
  if (state.decor && state.layout === "single") drawDecoration(ctx, 0, 0, w, h);
  drawLockup(ctx, w, h, state.layout);
  const y = drawCaption(ctx, w, h, state);
  drawBottomBar(ctx, w, h, y);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.24)";
  ctx.lineWidth = Math.max(1, h * 0.001);
  ctx.strokeRect(w * 0.012, h * 0.012, w * 0.976, h * 0.976);
  ctx.restore();
}
export { SIZES };
