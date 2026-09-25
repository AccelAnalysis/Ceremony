import {input,notice,num,clamp,esc,toast} from './editor-helpers.js';
import {dateInputValue} from './utils.js';

export function renderEventPanel(p,ctx){
 const {event,categories,tracks}=ctx.state;if(!event)return;
 const trackOpts=(id='')=>`<option value="">None</option>${tracks.filter(t=>t.enabled!==false).map(t=>`<option value="${esc(t.id)}" ${t.id===id?'selected':''}>${esc(t.title)}</option>`).join('')}`;
 p.innerHTML=`<h2 class="section-title">Event</h2><p class="section-sub">Global timing, schedule behavior, conditional categories, and ceremony-mode audio cues.</p><div class="form-grid">
  ${input('Event name',event.name,'text','id="eventTitle"')}
  ${input('Default slide duration (seconds)',event.defaultDuration,'number','id="defaultDuration" min="1" max="300" step="1"')}
  ${input('Transition duration (seconds)',event.transitionSeconds,'number','id="transitionSeconds" min="0" max="10" step="0.1"')}
  ${input('Overlay opacity',event.overlayOpacity,'number','id="overlayOpacity" min="0" max="1" step="0.01"')}
  ${input('Crossfade duration (seconds)',event.crossfadeSeconds??2.5,'number','id="crossfadeSeconds" min="0.1" max="30" step="0.1"')}
  ${input('Ceremony start',dateInputValue(event.ceremonyStartAt),'datetime-local','id="ceremonyStart"')}
  <div class="field"><label>Clock format</label><select id="clockFormat"><option value="12" ${event.clockFormat!=='24'?'selected':''}>12-hour</option><option value="24" ${event.clockFormat==='24'?'selected':''}>24-hour</option></select></div>
  <div class="field check"><label><input id="scheduleEnabled" type="checkbox" ${event.scheduleEnabled!==false?'checked':''}> Automatic schedule enabled</label></div>
  <div class="field check"><label><input id="catchUp" type="checkbox" ${event.catchUp!==false?'checked':''}> Catch up missed schedule actions</label></div>
  <div class="field check"><label><input id="autoCueMusic" type="checkbox" ${event.autoCueMusic!==false?'checked':''}> Auto-cue music when ceremony mode changes</label></div>
  <div class="field check"><label><input id="shufflePlaylist" type="checkbox" ${event.shufflePlaylist===true?'checked':''}> Shuffle when using Next Track</label></div>
  <div class="field check"><label><input id="loopPlaylist" type="checkbox" ${event.loopPlaylist!==false?'checked':''}> Loop current track on Audience Display</label></div>
  <div class="field check"><label><input id="duckSpecial" type="checkbox" ${event.duckSpecial!==false?'checked':''}> Duck music during graduate / award overlays</label></div>
  ${input('Ducked volume',event.duckVolume??.18,'number','id="duckVolume" min="0" max="1" step="0.01"')}
 </div><div class="toolbar"><button class="btn primary" id="saveEvent">Save event settings</button></div><div class="divider"></div>
 <h3>Conditional slide categories</h3>${notice('Disable a category to remove all of its slides from every active deck without deleting any slide.')}
 <div class="item-list" id="categoryList">${categories.map(c=>`<div class="item-row" data-id="${esc(c.id)}"><div class="num">${String(c.order).padStart(2,'0')}</div><div><b>${esc(c.name)}</b><div class="meta">${esc(c.id)}</div></div><label class="check"><input class="cat-enabled" type="checkbox" ${c.enabled!==false?'checked':''}> Included</label></div>`).join('')}</div>
 <div class="divider"></div><h3>Music cue by Ceremony Mode</h3><div class="form-grid">${['pre','ceremony','graduates','awards','post'].map(mode=>`<div class="field"><label>${esc(mode)}</label><select data-mode-track="${mode}">${trackOpts(event.modeTrackIds?.[mode]||'')}</select></div>`).join('')}</div><div class="toolbar"><button class="btn" id="saveModeTracks">Save mode music cues</button></div>`;
 p.querySelector('#saveEvent').onclick=async()=>{await ctx.backend.updateEvent(ctx.eventId,{name:p.querySelector('#eventTitle').value.trim().slice(0,120),defaultDuration:clamp(num(p.querySelector('#defaultDuration').value,10),1,300),transitionSeconds:clamp(num(p.querySelector('#transitionSeconds').value,1.4),0,10),overlayOpacity:clamp(num(p.querySelector('#overlayOpacity').value,.58),0,1),crossfadeSeconds:clamp(num(p.querySelector('#crossfadeSeconds').value,2.5),.1,30),ceremonyStartAt:p.querySelector('#ceremonyStart').value?new Date(p.querySelector('#ceremonyStart').value):null,clockFormat:p.querySelector('#clockFormat').value,scheduleEnabled:p.querySelector('#scheduleEnabled').checked,catchUp:p.querySelector('#catchUp').checked,autoCueMusic:p.querySelector('#autoCueMusic').checked,shufflePlaylist:p.querySelector('#shufflePlaylist').checked,loopPlaylist:p.querySelector('#loopPlaylist').checked,duckSpecial:p.querySelector('#duckSpecial').checked,duckVolume:clamp(num(p.querySelector('#duckVolume').value,.18),0,1)});toast('Event settings saved')};
 p.querySelector('#categoryList').onchange=async e=>{const box=e.target.closest('.cat-enabled');if(!box)return;const row=box.closest('[data-id]'),c=categories.find(x=>x.id===row.dataset.id);if(c)await ctx.backend.putDoc(ctx.eventId,'categories',c.id,{order:c.order,name:c.name,enabled:box.checked})};
 p.querySelector('#saveModeTracks').onclick=async()=>{const modeTrackIds={};p.querySelectorAll('[data-mode-track]').forEach(s=>modeTrackIds[s.dataset.modeTrack]=s.value);await ctx.backend.updateEvent(ctx.eventId,{modeTrackIds});toast('Mode music cues saved')};
}
