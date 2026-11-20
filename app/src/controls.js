import {listPresets,savePreset,randomPreset} from "./presets.js";
import { LAYOUTS, GRADES, LETTERING, LOOKS, SIZES, resetState } from "./state.js";
import { resetCrop, refreshPhotoList, fitPanels } from "./photos.js";
export function bindControls(api) {
  const s = api.state,
    el = (id) => document.getElementById(id);
  const build = (id, obj, cls = "") => {
    const host = el(id);
    host.replaceChildren();
    for (const [key, v] of Object.entries(obj)) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.key = key;
      b.textContent = v.label;
      b.className = cls;
      host.append(b);
    }
  };
  build("layouts", LAYOUTS);
  build("looks", LOOKS, "look");
  for (const [id, obj] of [
    ["grade", GRADES],
    ["lettering", LETTERING],
    ["size", SIZES],
  ])
    el(id).replaceChildren(
      ...Object.entries(obj).map(([k, v]) => {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = v.label;
        return o;
      }),
    );
  el("editorTabs").onclick=e=>{const b=e.target.closest("button[data-pane]");if(!b)return;document.querySelectorAll("[data-pane-content]").forEach(x=>x.hidden=x.dataset.paneContent!==b.dataset.pane);document.querySelectorAll("#editorTabs button").forEach(x=>x.classList.toggle("active",x===b))};
  el("layouts").onclick = (e) => {
    if (e.target.dataset.key) api.setLayout(e.target.dataset.key);
  };
  const presetRefresh=()=>{const host=el("presetStrip");host.replaceChildren();for(const p of listPresets()){const b=document.createElement("button");b.className="preset-chip";b.textContent=p.label||p.name;b.onclick=()=>{api.setLook(p.grade||"neon");s.caption=p.caption||s.caption;el("caption").value=s.caption;api.render()};host.append(b)}};presetRefresh();el("savePreset").onclick=()=>{savePreset({name:`My ${new Date().toLocaleTimeString()}`,grade:s.grade,lettering:s.lettering,decor:s.decor,caption:s.caption});presetRefresh()};el("randomPreset").onclick=()=>{const p=randomPreset();api.setLook(p.grade);s.caption=p.caption;el("caption").value=s.caption;api.render()};
  const presetLib=el("presetLibrary");for(const p of listPresets()){const b=document.createElement("button");b.className="preset-chip";b.textContent=p.label||p.name;b.onclick=()=>{api.setLook(p.grade||"neon");s.caption=p.caption||s.caption;el("caption").value=s.caption;api.render()};presetLib.append(b)}
  const layerHost=el("layerList");const drawLayerList=()=>{layerHost.replaceChildren();s.layers.forEach((l,i)=>{const row=document.createElement("label");row.className="check";const cb=document.createElement("input");cb.type="checkbox";cb.checked=l.visible;cb.onchange=()=>{l.visible=cb.checked;api.render()};row.append(cb,document.createTextNode(l.name));layerHost.append(row)})};drawLayerList();el("layerRotate").oninput=e=>{const l=s.layers.find(x=>!x.locked&&x.type==="text"&&x.visible);if(l){l.rotation=Number(e.target.value);api.render()}};
  const hist=window.makefunHistory;const histButtons=()=>{el("undo").disabled=!hist.canUndo();el("redo").disabled=!hist.canRedo()};const checkpoint=()=>{hist.push({layout:s.layout,size:s.size,caption:s.caption,grade:s.grade,lettering:s.lettering,decor:s.decor,hue:s.hue,saturation:s.saturation,contrast:s.contrast,warmth:s.warmth,vignette:s.vignette,capSize:s.capSize,spacing:s.spacing,outline:s.outline,shadow:s.shadow,capY:s.capY,crops:s.crops,layers:s.layers})};const restore=o=>{Object.assign(s,o);api.syncInputs();drawLayerList();api.render();histButtons()};el("undo").onclick=()=>{const o=hist.undo({layout:s.layout,size:s.size,caption:s.caption,grade:s.grade,lettering:s.lettering,decor:s.decor,hue:s.hue,saturation:s.saturation,contrast:s.contrast,warmth:s.warmth,vignette:s.vignette,capSize:s.capSize,spacing:s.spacing,outline:s.outline,shadow:s.shadow,capY:s.capY,crops:s.crops,layers:s.layers});restore(o)};el("redo").onclick=()=>{const o=hist.redo({layout:s.layout,size:s.size,caption:s.caption,grade:s.grade,lettering:s.lettering,decor:s.decor,hue:s.hue,saturation:s.saturation,contrast:s.contrast,warmth:s.warmth,vignette:s.vignette,capSize:s.capSize,spacing:s.spacing,outline:s.outline,shadow:s.shadow,capY:s.capY,crops:s.crops,layers:s.layers});restore(o)};
  el("layouts").onclick = (e) => { if (e.target.dataset.key) api.setLayout(e.target.dataset.key); };
  el("looks").onclick = (e) => {
    if (e.target.dataset.key) api.setLook(e.target.dataset.key);
  };
  const bind = (id, key, change = () => {}) =>
    el(id).addEventListener("input", (e) => {
      checkpoint();
      s[key] =
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.type === "range"
            ? Number(e.target.value)
            : e.target.value;
      change();
      api.render();
    });
  for (const [id, key] of [
    ["caption", "caption"],
    ["grade", "grade"],
    ["lettering", "lettering"],
    ["size", "size"],
    ["decor", "decor"],
    ["varyPanels", "varyPanels"],
    ["hue", "hue"],
    ["saturation", "saturation"],
    ["contrast", "contrast"],
    ["warmth", "warmth"],
    ["vignette", "vignette"],
    ["ink", "ink"],
    ["capSize", "capSize"],
    ["spacing", "spacing"],
    ["outline", "outline"],
    ["shadow", "shadow"],
    ["capY", "capY"],
  ])
    bind(id, key, () => {
      if (id === "size") api.fitCanvas();
    });
  el("zoom").oninput = (e) => {
    s.crops[s.selected].zoom = Number(e.target.value);
    api.sync();
    api.render();
  };
  el("varyPanels").onchange = (e) => {
    s.varyPanels = e.target.checked;
    fitPanels(s);
    refreshPhotoList(s);
    api.render();
  };
  el("rotate").onclick = () => {
    s.crops[s.selected].rotate = (s.crops[s.selected].rotate + 90) % 360;
    api.render();
  };
  el("flip").onclick = () => {
    s.crops[s.selected].flip = !s.crops[s.selected].flip;
    api.render();
  };
  el("resetCrop").onclick = () => {
    resetCrop(s.crops[s.selected]);
    api.sync();
    api.render();
  };
  const addPhoto = async (file) => {
    try {
      await api.loadPhoto(file, s, () => {
        fitPanels(s);
        refreshPhotoList(s);
      });
      api.render();
    } catch {
      api.toast(`Could not read ${file.name}`);
    }
  };
  el("samples").onclick = async () => {
    const start = s.photos.length;
    const loaded = await Promise.all(
      [0, 1, 2, 3].map((i) => api.loadSample(i, s, () => {}).catch(() => null)),
    );
    const valid = loaded.filter(Boolean);
    if (!valid.length) {
      api.toast("No bundled sample photos could be loaded");
      api.render();
      return;
    }
    const indices = valid.map((_, i) => start + i);
    s.crops = valid.map((img, i) => ({
      photo: indices[i],
      x: (img._samplePosition?.[0] ?? 0.5) - 0.5,
      y: (img._samplePosition?.[1] ?? 0.5) - 0.5,
      zoom: img._sampleZoom || 1,
      rotate: 0,
      flip: false,
    }));
    refreshPhotoList(s);
    api.toast(`${valid.length} sample vignettes loaded`);
    api.render();
  };
  let varySeed=1937;
  el("vary").onclick=()=>{s.crops.forEach((c,i)=>{varySeed=(varySeed*1664525+1013904223)>>>0;c.x=((varySeed&65535)/65535-.5)*.9;varySeed=(varySeed*1664525+1013904223)>>>0;c.y=((varySeed&65535)/65535-.5)*.8;c.zoom=[1,1.35,1.15][i%3]+((varySeed>>>16)/65535-.5)*.18;});api.render();};
  el("files").onchange = async (e) => {
    for (const file of e.target.files) await addPhoto(file);
    el("files").value = "";
  };
  const drop = el("drop");
  drop.ondragover = (e) => {
    e.preventDefault();
    drop.style.borderColor = "#ff4f91";
  };
  drop.ondragleave = () => (drop.style.borderColor = "");
  drop.ondrop = async (e) => {
    e.preventDefault();
    drop.style.borderColor = "";
    for (const f of e.dataTransfer.files)
      if (f.type.startsWith("image/")) await addPhoto(f);
  };
  el("photoList").onclick = (e) => {
    if (e.target.dataset.photo !== undefined) {
      const photo = Number(e.target.dataset.photo);
      if (s.varyPanels) s.crops[s.selected].photo = photo;
      else s.crops.forEach((crop) => { crop.photo = photo; });
      refreshPhotoList(s);
      api.render();
    }
  };
  el("random").onclick = () => {
    const keys = Object.keys(LOOKS),
      k = keys[Math.floor(Math.random() * keys.length)];
    api.setLook(k);
    s.caption = [
      "MIDNIGHT RUN",
      "NO RULES TONIGHT",
      "CITY OF DREAMS",
      "AFTER THE GLOW",
    ][Math.floor(Math.random() * 4)];
    el("caption").value = s.caption;
    api.render();
  };
  el("resetAll").onclick = () => {
    resetState();
    api.setLayout(s.layout);
    api.syncInputs();
    refreshPhotoList(s);
    api.render();
    api.toast("Studio reset");
  };
}
