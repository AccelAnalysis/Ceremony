import {notice,toast} from './editor-helpers.js';
import {buildSeedPayload} from './seed-data.js';

const META_KEYS=['name','status','defaultDuration','transitionSeconds','overlayOpacity','cinemaIntensity','crossfadeSeconds','countdownLabel','clockFormat','scheduleEnabled','catchUp','ceremonyStartAt','autoCueMusic','clockLayout','countdownLayout','modeTrackIds'];
const RUNTIME_KEYS=['mode','currentSlideId','playing','overlayVisible','captionsVisible','brandVisible','progressVisible','motionEnabled','clockVisible','countdownVisible','specialType','specialId','specialVisible','messageText','awardRevealed','trackId','musicCommand','musicCommandSeq','musicVolume','musicMuted','stateVersion'];

function pick(obj,keys){const out={};for(const k of keys)if(obj&&Object.prototype.hasOwnProperty.call(obj,k))out[k]=obj[k];return out}
function records(raw,name,prefix){
 const list=Array.isArray(raw?.[name])?raw[name]:[];
 return list.filter(x=>x&&typeof x==='object').map((x,i)=>({...x,id:String(x.id||`${prefix}${String(i+1).padStart(3,'0')}`)}));
}
function normalizeImport(raw,currentName='AK9I Graduation'){
 if(!raw||typeof raw!=='object')throw new Error('The selected file does not contain a JSON object.');
 const sourceMeta=raw.meta||raw.event||{};
 const base=buildSeedPayload(sourceMeta.name||currentName);
 const runtimeSource=raw.runtime||{};
 return {
  meta:{...base.meta,...pick(sourceMeta,META_KEYS)},
  slides:Array.isArray(raw.slides)?records(raw,'slides','slide-'):base.slides,
  categories:Array.isArray(raw.categories)?records(raw,'categories','category-'):base.categories,
  graduates:Array.isArray(raw.graduates)?records(raw,'graduates','graduate-'):[],
  awards:Array.isArray(raw.awards)?records(raw,'awards','award-'):[],
  tracks:Array.isArray(raw.tracks)?records(raw,'tracks','track-'):[],
  schedule:Array.isArray(raw.schedule)?records(raw,'schedule','cue-'):[],
  runtime:{...base.runtime,...pick(runtimeSource,RUNTIME_KEYS)}
 };
}

export function renderDataPanel(p,ctx){
 const event=ctx.state.event;
 p.innerHTML=`<h2 class="section-title">Setup / Data</h2>
 ${notice(`Event ID: <b>${ctx.eventId}</b> · Backend: <b>${ctx.demoMode?'Demo / local':'Firebase · ceremony-d1618'}</b>`)}
 <div id="dataStatus" class="muted" style="margin:10px 0 14px"></div>
 <div class="toolbar">
   <button class="btn primary" id="seed">${event?'Reset to AK9I starter deck':'Create AK9I starter event'}</button>
   <button class="btn" id="export" ${event?'':'disabled'}>Export event JSON</button>
 </div>
 <div class="divider"></div>
 <h3>Import event JSON</h3>
 <p class="muted">Import a Ceremony JSON export or compatible event JSON. Import replaces the editor-managed slides, categories, graduates, awards, music tracks, schedule, and runtime state for this event.</p>
 <div class="toolbar">
   <input id="importFile" type="file" accept=".json,application/json">
   <button class="btn" id="importBtn">Import JSON</button>
 </div>
 <div class="divider"></div>
 <h3>Firebase connection</h3>
 <p class="muted">Firebase is configured in the deployed application. You do not need to enter an API key or App ID on individual devices.</p>`;

 const status=p.querySelector('#dataStatus');
 const setStatus=(msg,isError=false)=>{status.textContent=msg||'';status.style.color=isError?'#ffb4ab':''};

 p.querySelector('#seed').onclick=async e=>{
  if(event&&!confirm('Reset this event to the starter deck? This replaces the editor-managed event data.'))return;
  const btn=e.currentTarget;btn.disabled=true;setStatus('Creating starter event…');
  try{
   await ctx.backend.seedEvent(ctx.eventId,buildSeedPayload(event?.name||'AK9I Graduation'));
   setStatus('Starter event ready.');toast('Starter event ready');
  }catch(err){console.error(err);setStatus(`Starter event failed: ${err.message}`,true);toast('Starter event failed')}
  finally{btn.disabled=false}
 };

 p.querySelector('#export').onclick=()=>{
  if(!ctx.state.event)return;
  const blob=new Blob([JSON.stringify(ctx.state,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`${ctx.eventId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 };

 p.querySelector('#importBtn').onclick=async e=>{
  const file=p.querySelector('#importFile').files?.[0];
  if(!file){setStatus('Choose a JSON file first.',true);return}
  if(event&&!confirm('Import this JSON and replace the current editor-managed event data?'))return;
  const btn=e.currentTarget;btn.disabled=true;setStatus(`Reading ${file.name}…`);
  try{
   const raw=JSON.parse(await file.text());
   const payload=normalizeImport(raw,event?.name||'AK9I Graduation');
   await ctx.backend.seedEvent(ctx.eventId,payload);
   setStatus(`Imported ${file.name} successfully.`);toast('Event JSON imported');
  }catch(err){console.error(err);setStatus(`Import failed: ${err.message}`,true);toast('JSON import failed')}
  finally{btn.disabled=false}
 };
}
