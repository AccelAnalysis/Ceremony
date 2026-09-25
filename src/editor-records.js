import {input,modal,closeOnCancel,num,clamp,esc,toast,notice} from './editor-helpers.js';
import {uid} from './utils.js';

export function renderGraduatePanel(p,ctx){renderRecords(p,ctx,{title:'Graduates',items:ctx.state.graduates,collection:'graduates',label:x=>x.name,fields:[['Name','name',160],['Program / credential','program',300],['K9 / team','k9',200],['Recognition statement','statement',1000],['Photo URL','photoUrl',2048]]})}
export function renderAwardPanel(p,ctx){renderRecords(p,ctx,{title:'Awards',items:ctx.state.awards,collection:'awards',label:x=>x.name,fields:[['Award name','name',200],['Recipient','recipient',200],['Citation','citation',1000],['Background image URL','imageUrl',2048]]})}

export function renderMusicPanel(p,ctx){
 const items=ctx.state.tracks;
 p.innerHTML=`<div class="panel-head"><div><h2 class="section-title">Music tracks · ${items.length}</h2><p class="section-sub">Add hosted audio URLs or upload audio files directly to Firebase Storage for use across devices.</p></div><button class="btn primary" id="addUrlTrack">Add URL track</button></div>
 ${notice('Uploaded audio is stored under this event in Firebase Storage. The Audience Display still requires one click on “Arm event audio” before browsers will allow scheduled playback.')}
 <div class="panel" style="margin:14px 0">
   <h3>Upload audio files</h3>
   <div class="toolbar"><input id="audioFiles" type="file" accept="audio/*" multiple><button class="btn primary" id="uploadAudio">Upload selected</button></div>
   <div id="uploadStatus" class="muted" style="margin-top:10px"></div>
 </div>
 <div class="item-list">${items.map(x=>`<article class="item-card" data-id="${esc(x.id)}"><div class="item-card-head"><div><b>${esc(x.title||x.id)}</b><div class="meta">${x.source==='upload'?'Uploaded file':'URL'} · ${x.enabled===false?'disabled':'enabled'}</div></div><div class="toolbar"><button class="btn edit">Edit</button><button class="btn danger remove">Remove</button></div></div></article>`).join('')}</div>
 <div class="notice">Mode-specific music cues are assigned in the Event panel. Shuffle, loop, crossfade, and ducking behavior are also configured there.</div>`;

 const status=p.querySelector('#uploadStatus');
 p.querySelector('#addUrlTrack').onclick=()=>openTrack({id:uid('track'),order:(items.at(-1)?.order||0)+1,enabled:true,title:'New Track',url:'',source:'url',storagePath:''});
 p.querySelectorAll('[data-id]').forEach(row=>{
  const x=items.find(i=>i.id===row.dataset.id);
  row.querySelector('.edit').onclick=()=>openTrack(x);
  row.querySelector('.remove').onclick=async()=>{
   if(!confirm(`Remove “${x.title||'this track'}”?`))return;
   try{if(ctx.backend.deleteTrack)await ctx.backend.deleteTrack(ctx.eventId,x);else await ctx.backend.deleteDoc(ctx.eventId,'tracks',x.id);toast('Track removed')}
   catch(e){console.error(e);toast('Track removal failed');alert(e.message)}
  };
 });

 p.querySelector('#uploadAudio').onclick=async e=>{
  const files=[...(p.querySelector('#audioFiles').files||[])];
  if(!files.length){status.textContent='Choose one or more audio files first.';return}
  if(!ctx.backend.uploadAudio){status.textContent='File upload requires the Firebase backend.';return}
  const btn=e.currentTarget;btn.disabled=true;
  let order=(items.at(-1)?.order||0)+1;
  try{
   for(let i=0;i<files.length;i++){
    const file=files[i];
    status.textContent=`Uploading ${i+1} of ${files.length}: ${file.name} · 0%`;
    const uploaded=await ctx.backend.uploadAudio(ctx.eventId,file,pct=>status.textContent=`Uploading ${i+1} of ${files.length}: ${file.name} · ${pct}%`);
    const title=file.name.replace(/\.[^.]+$/,'').slice(0,200)||'Uploaded Track';
    await ctx.backend.putDoc(ctx.eventId,'tracks',uid('track'),{order:order++,enabled:true,title,url:uploaded.url,source:'upload',storagePath:uploaded.storagePath});
   }
   status.textContent=`${files.length} audio file${files.length===1?'':'s'} uploaded successfully.`;
   p.querySelector('#audioFiles').value='';
   toast('Audio upload complete');
  }catch(err){
   console.error(err);
   const hint=String(err?.code||'').includes('storage/')?' Make sure Firebase Storage is enabled and the deployed Storage Rules allow this event owner to upload audio.':'';
   status.textContent=`Upload failed: ${err.message}.${hint}`;
   toast('Audio upload failed');
  }finally{btn.disabled=false}
 };

 function openTrack(x){
  const m=modal('Music Track',`<div class="stack">${input('Track title',x.title||'','text','id="trackTitle"')}${input('Audio URL',x.url||'','url','id="trackUrl"')}${input('Order',x.order||items.length+1,'number','id="trackOrder" min="1" max="999"')}<div class="field check"><label><input id="trackEnabled" type="checkbox" ${x.enabled!==false?'checked':''}> Enabled</label></div>${x.source==='upload'?'<div class="notice">This track was uploaded to Firebase Storage. Editing its URL does not delete the stored file; removing the track does.</div>':''}</div><div class="toolbar" style="margin-top:16px"><button class="btn primary" data-save>Save</button><button class="btn" data-cancel>Cancel</button></div>`);
  closeOnCancel(m);
  m.querySelector('[data-save]').onclick=async()=>{
   const data={title:m.querySelector('#trackTitle').value.trim().slice(0,200),url:m.querySelector('#trackUrl').value.trim().slice(0,2048),order:clamp(num(m.querySelector('#trackOrder').value,items.length+1),1,999),enabled:m.querySelector('#trackEnabled').checked,source:x.source||'url',storagePath:x.storagePath||''};
   await ctx.backend.putDoc(ctx.eventId,'tracks',x.id,data);m.remove();toast('Track saved');
  };
 }
}

function renderRecords(p,ctx,{title,items,collection,label,fields,after=''}){
 p.innerHTML=`<div class="panel-head"><h2 class="section-title">${esc(title)} · ${items.length}</h2><button class="btn primary" id="addRecord">Add</button></div><div class="item-list">${items.map(x=>`<article class="item-card" data-id="${esc(x.id)}"><div class="item-card-head"><b>${esc(label(x)||x.id)}</b><div class="toolbar"><button class="btn edit">Edit</button><button class="btn danger remove">Remove</button></div></div></article>`).join('')}</div>${after}`;
 p.querySelector('#addRecord').onclick=()=>open({id:uid(collection.slice(0,-1)),order:(items.at(-1)?.order||0)+1,enabled:true});
 p.querySelectorAll('[data-id]').forEach(row=>{const x=items.find(i=>i.id===row.dataset.id);row.querySelector('.edit').onclick=()=>open(x);row.querySelector('.remove').onclick=async()=>{if(confirm('Remove this item?'))await ctx.backend.deleteDoc(ctx.eventId,collection,x.id)}});
 function open(x){const m=modal(title,`<div class="stack">${fields.map(([l,k])=>input(l,x[k]||'',k.toLowerCase().includes('url')?'url':'text',`data-field="${k}"`)).join('')}${input('Order',x.order||items.length+1,'number','id="recordOrder" min="1" max="999"')}<div class="field check"><label><input id="recordEnabled" type="checkbox" ${x.enabled!==false?'checked':''}> Enabled</label></div></div><div class="toolbar" style="margin-top:16px"><button class="btn primary" data-save>Save</button><button class="btn" data-cancel>Cancel</button></div>`);closeOnCancel(m);m.querySelector('[data-save]').onclick=async()=>{const data={};for(const [,key,max] of fields)data[key]=m.querySelector(`[data-field="${key}"]`).value.trim().slice(0,max);data.order=clamp(num(m.querySelector('#recordOrder').value,items.length+1),1,999);data.enabled=m.querySelector('#recordEnabled').checked;await ctx.backend.putDoc(ctx.eventId,collection,x.id,data);m.remove();toast(`${title.slice(0,-1)} saved`)}}
}
