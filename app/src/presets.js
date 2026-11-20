import {LOOKS} from "./state.js";
export const STORAGE_KEY="makefun.coverart.presets.v1";
const builtins=Object.entries(LOOKS).flatMap(([key,v])=>[0,1,2].map((n)=>({id:`${key}-${n}`,name:["Afterglow","Neon Nights","City Heat"][n],label:`${v.label} · ${["Afterglow","Neon Nights","City Heat"][n]}`,grade:key,lettering:v.lettering,decor:v.decor,filters:[{name:"grade",options:{hue:n*5,saturation:1.15+n*.1,contrast:1.1,warmth:n*8}}],caption:["AFTER THE GLOW","CITY NEVER SLEEPS","NO RULES TONIGHT"][n],layers:[{type:"text",text:["AFTER THE GLOW","CITY NEVER SLEEPS","NO RULES TONIGHT"][n],x:.5,y:.87,visible:true}]})));
export function listPresets(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return [...builtins,...(Array.isArray(x)?x:[])]}catch{return builtins}}
export function savePreset(p){let saved=[];try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{};saved.push({...p,id:p.id||`user-${Date.now()}`});localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));return saved.at(-1)}
export function loadPreset(id){return listPresets().find(p=>p.id===id)||null}
export function deletePreset(id){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY))||[];localStorage.setItem(STORAGE_KEY,JSON.stringify(saved.filter(p=>p.id!==id)));return true}catch{return false}}
export function randomPreset(){const a=listPresets();return a[Math.floor(Math.random()*a.length)]}
