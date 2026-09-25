import {mountAuthGate} from './auth-ui.js';
import {getBackend} from './backend.js';
import {eventIdFromUrl,rememberEventId,formatClock} from './utils.js';
import {MODE_LABELS,MODE_AUTO,activeSlides,actionPatch} from './state.js';
import {startScheduler} from './scheduler.js';

const eventId=eventIdFromUrl();rememberEventId(eventId);
await mountAuthGate({title:'Event Director',allowSignUp:false,subtitle:'Live control · '+eventId});
const {backend,auth}=await getBackend();

let event=null,runtime=null,slides=[],categories=[],graduates=[],awards=[],tracks=[],schedule=[];
let wakeLock=null,autoAdvanceTimer=0,holdEngaged=false;
const snap=()=>({event,runtime,slides,categories,graduates,awards,tracks,schedule});

backend.subscribeEvent(eventId,v=>{
 event=v;
 document.querySelector('#eventName').textContent=v?.name||'Event not found';
 const href='../display/?event='+encodeURIComponent(eventId);
 document.querySelector('#displayLink').href=href;
 document.querySelector('#displayLinkMobile').href=href;
 renderState();renderNextCue();scheduleAutoAdvance();
});
backend.subscribeCollection(eventId,'slides',v=>{slides=v;renderState();scheduleAutoAdvance()});
backend.subscribeCollection(eventId,'categories',v=>{categories=v;renderState();scheduleAutoAdvance()});
backend.subscribeCollection(eventId,'graduates',v=>{graduates=v;fillSelect('#graduateSelect',v,'name')});
backend.subscribeCollection(eventId,'awards',v=>{awards=v;fillSelect('#awardSelect',v,'name')});
backend.subscribeCollection(eventId,'tracks',v=>{tracks=v;fillSelect('#trackSelect',v,'title');renderState()});
backend.subscribeCollection(eventId,'schedule',v=>{
 schedule=v;
 const enabled=v.filter(x=>x.enabled).length;
 document.querySelector('#scheduleStatus').textContent=enabled+' enabled schedule action'+(enabled===1?'':'s')+' · one-time executions are claimed transactionally.';
 renderNextCue();
});
backend.subscribeRuntime(eventId,v=>{runtime=v;if(runtime?.playing)holdEngaged=false;renderState();renderConnection();scheduleAutoAdvance()});

startScheduler({eventId,backend,getSnapshot:snap,onExecution:i=>{
 document.querySelector('#scheduleStatus').textContent='Executed: '+(i.label||i.action);
 renderNextCue();
}});

function fillSelect(sel,arr,label){
 const el=document.querySelector(sel),cur=el.value;
 const enabled=arr.filter(x=>x.enabled!==false);
 el.innerHTML=enabled.map(x=>'<option value="'+x.id+'">'+(x[label]||x.id)+'</option>').join('');
 if(enabled.some(x=>x.id===cur))el.value=cur;
 else if(enabled.length)el.value=enabled[0].id;
}
function setToggle(id,on,onText,offText){
 const el=document.querySelector(id);if(!el)return;
 el.textContent=on?onText:offText;
 el.classList.toggle('active',!!on);
 el.setAttribute('aria-pressed',String(!!on));
}
function setPlayUI(){
 const playing=!!runtime?.playing;
 document.querySelector('#playState').textContent=playing?'Playing':'Paused';
 document.querySelector('#playState').classList.toggle('ok',playing);
 document.querySelectorAll('[data-play-toggle]').forEach(el=>{
  el.setAttribute('aria-label',playing?'Pause presentation':'Play presentation');
  el.setAttribute('aria-pressed',String(playing));
  if(el.classList.contains('transport-btn')){
   const icon=el.querySelector('.transport-icon'),label=el.querySelector('small');
   if(icon)icon.textContent=playing?'Ⅱ':'▶';
   if(label)label.textContent=playing?'Pause':'Play';
  }else el.textContent=playing?'Pause':'Play';
 });
}
function renderState(){
 if(!runtime)return;
 const modeLabel=MODE_LABELS[runtime.mode]||runtime.mode;
 document.querySelector('#modeTitle').textContent=modeLabel;
 document.querySelector('#modePickerLabel').textContent=modeLabel;
 document.querySelector('#stateVersion').textContent=runtime.stateVersion??'—';
 document.querySelector('#stateVersionMore').textContent=runtime.stateVersion??'—';
 const s=slides.find(x=>x.id===runtime.currentSlideId);
 document.querySelector('#currentSlide').textContent=s?(String(s.order).padStart(2,'0')+' · '+s.title):'No active slide';
 document.querySelectorAll('.mode-btn').forEach(b=>{
  const active=b.dataset.mode===runtime.mode;
  b.classList.toggle('active',active);
  b.setAttribute('aria-pressed',String(active));
 });
 setPlayUI();
 setToggle('#clockToggle',runtime.clockVisible,'Hide Clock','Show Clock');
 setToggle('#countdownToggle',runtime.countdownVisible,'Hide Countdown','Show Countdown');
 setToggle('#overlayToggle',runtime.overlayVisible!==false,'Hide Overlay','Show Overlay');
 setToggle('#captionsToggle',runtime.captionsVisible!==false,'Hide Captions','Show Captions');
 setToggle('#brandToggle',runtime.brandVisible!==false,'Hide Branding','Show Branding');
 setToggle('#motionToggle',runtime.motionEnabled!==false,'Stop Motion','Start Motion');
 setToggle('#progressToggle',runtime.progressVisible!==false,'Hide Progress','Show Progress');
 setToggle('#cinemaToggle',runtime.cinemaVisible!==false,'Hide Cinematic','Show Cinematic');
 document.querySelector('#muteBtn').textContent=runtime.musicMuted?'Unmute':'Mute';
 document.querySelector('#muteBtn').setAttribute('aria-pressed',String(!!runtime.musicMuted));
 document.querySelector('#volume').value=Math.round((runtime.musicVolume??.35)*100);
 if(event){
  document.querySelector('#shuffleToggle').checked=event.shufflePlaylist===true;
  document.querySelector('#loopToggle').checked=event.loopPlaylist!==false;
  document.querySelector('#duckToggle').checked=event.duckSpecial!==false;
 }
 const nowTrack=tracks.find(t=>t.id===runtime.trackId);
 document.querySelector('#musicNow').textContent=nowTrack?('Now: '+nowTrack.title):'No track selected';
 if(runtime.trackId&&document.querySelector('#trackSelect').querySelector('option[value="'+CSS.escape(runtime.trackId)+'"]'))document.querySelector('#trackSelect').value=runtime.trackId;
 const hold=document.querySelector('#emergencyHold');
 hold.textContent=holdEngaged?'Resume Event':'Hold Event';
 hold.classList.toggle('held',holdEngaged);
 hold.setAttribute('aria-pressed',String(holdEngaged));
}
function currentSlides(mode=runtime?.mode){return activeSlides(slides,categories,mode)}
function scheduleAutoAdvance(){
 clearTimeout(autoAdvanceTimer);
 if(!event||!runtime?.playing||!MODE_AUTO[runtime.mode])return;
 const list=currentSlides(runtime.mode),current=list.find(x=>x.id===runtime.currentSlideId)||list[0];
 if(!current)return;
 const dur=(current.duration>0?current.duration:event.defaultDuration||10)*1000;
 const started=runtime.slideStartedAt instanceof Date?runtime.slideStartedAt.getTime():runtime.slideStartedAt?new Date(runtime.slideStartedAt).getTime():Date.now();
 const wait=Math.max(20,started+dur-Date.now()),version=runtime.stateVersion||0;
 autoAdvanceTimer=setTimeout(async()=>{try{
  const latest=runtime;if(!latest||latest.stateVersion!==version||!latest.playing||!MODE_AUTO[latest.mode])return;
  await backend.claimSchedule(eventId,'auto_'+version,r=>{
   if((r.stateVersion||0)!==version||!r.playing||!MODE_AUTO[r.mode])return null;
   const freshList=currentSlides(r.mode);
   return Object.assign(r,actionPatch('slide:next','',r,{event,slides:freshList,slidesByMode:{[r.mode]:freshList}}));
  });
 }catch(e){console.warn('auto advance',e)}},wait);
}
async function command(action,arg=''){
 if(!runtime)return;
 if(action==='deck:play')holdEngaged=false;
 const modeLists={};for(const m of Object.keys(MODE_LABELS))modeLists[m]=currentSlides(m);
 await backend.mutateRuntime(eventId,r=>Object.assign(r,actionPatch(action,arg,r,{event,slides:modeLists[r.mode]||currentSlides(),slidesByMode:modeLists})));
}
async function saveEventPatch(patch){if(!event)return;await backend.updateEvent(eventId,patch)}

function modeButtons(){
 return Object.entries(MODE_LABELS).map(([k,v])=>'<button class="mode-btn" type="button" data-mode="'+k+'" aria-pressed="false">'+v+'</button>').join('');
}
const modeGrid=document.querySelector('#modeGrid'),modeSheetGrid=document.querySelector('#modeSheetGrid');
modeGrid.innerHTML=modeButtons();modeSheetGrid.innerHTML=modeButtons();
function handleModeClick(e){
 const b=e.target.closest('[data-mode]');if(!b)return;
 command('mode:'+b.dataset.mode);setModeSheet(false);
}
modeGrid.onclick=handleModeClick;modeSheetGrid.onclick=handleModeClick;

const modeSheet=document.querySelector('#modeSheet'),modePickerBtn=document.querySelector('#modePickerBtn');
function setModeSheet(open){
 modeSheet.classList.toggle('open',open);
 modeSheet.setAttribute('aria-hidden',String(!open));
 modePickerBtn.setAttribute('aria-expanded',String(open));
 if(open)modeSheet.querySelector('.mode-btn.active')?.focus();
}
modePickerBtn.onclick=()=>setModeSheet(!modeSheet.classList.contains('open'));
modeSheet.querySelectorAll('[data-close-mode]').forEach(x=>x.onclick=()=>setModeSheet(false));

document.querySelectorAll('[data-director-tab]').forEach(tab=>tab.onclick=()=>{
 const key=tab.dataset.directorTab;
 document.querySelectorAll('[data-director-tab]').forEach(x=>{const active=x===tab;x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active))});
 document.querySelectorAll('[data-view-panel]').forEach(x=>x.classList.toggle('active',x.dataset.viewPanel===key));
 window.scrollTo({top:0,behavior:'smooth'});
});

document.body.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(b)command(b.dataset.action);
 const play=e.target.closest('[data-play-toggle]');if(play)command(runtime?.playing?'deck:pause':'deck:play');
});

document.querySelector('#clockToggle').onclick=()=>command(runtime.clockVisible?'clock:hide':'clock:show');
document.querySelector('#countdownToggle').onclick=()=>command(runtime.countdownVisible?'countdown:hide':'countdown:show');
document.querySelector('#overlayToggle').onclick=()=>command(runtime.overlayVisible!==false?'overlay:hide':'overlay:show');
document.querySelector('#captionsToggle').onclick=()=>command(runtime.captionsVisible!==false?'captions:hide':'captions:show');
document.querySelector('#brandToggle').onclick=()=>command(runtime.brandVisible!==false?'brand:hide':'brand:show');
document.querySelector('#motionToggle').onclick=()=>command(runtime.motionEnabled!==false?'motion:hide':'motion:show');
document.querySelector('#progressToggle').onclick=()=>command(runtime.progressVisible!==false?'progress:hide':'progress:show');
document.querySelector('#cinemaToggle').onclick=()=>command(runtime.cinemaVisible!==false?'cinema:hide':'cinema:show');

document.querySelector('#showMessage').onclick=()=>command('message:show',document.querySelector('#messageInput').value);
document.querySelector('#showGraduate').onclick=()=>command('graduate:show',document.querySelector('#graduateSelect').value);
document.querySelector('#prevGraduate').onclick=()=>{const list=graduates.filter(g=>g.enabled!==false);if(!list.length)return;let i=list.findIndex(g=>g.id===runtime.specialId);if(i<0)i=0;i=(i-1+list.length)%list.length;document.querySelector('#graduateSelect').value=list[i].id;command('graduate:show',list[i].id)};
document.querySelector('#nextGraduate').onclick=()=>{const list=graduates.filter(g=>g.enabled!==false);if(!list.length)return;let i=list.findIndex(g=>g.id===runtime.specialId);i=(i+1)%list.length;document.querySelector('#graduateSelect').value=list[i].id;command('graduate:show',list[i].id)};
document.querySelector('#stageAward').onclick=()=>command('award:stage',document.querySelector('#awardSelect').value);
document.querySelector('#revealAward').onclick=()=>command('award:reveal',document.querySelector('#awardSelect').value);

function enabledTracks(){return tracks.filter(t=>t.enabled!==false)}
function pickRelativeTrack(delta){
 const list=enabledTracks();if(!list.length)return null;
 if(event?.shufflePlaylist&&list.length>1){
  const choices=list.filter(t=>t.id!==runtime?.trackId);
  return choices[Math.floor(Math.random()*choices.length)]||list[0];
 }
 let i=list.findIndex(t=>t.id===runtime?.trackId);if(i<0)i=delta>0?-1:0;
 return list[(i+delta+list.length)%list.length];
}
document.querySelector('#playTrack').onclick=()=>command('music:track',document.querySelector('#trackSelect').value);
document.querySelector('#prevTrack').onclick=()=>{const t=pickRelativeTrack(-1);if(t){document.querySelector('#trackSelect').value=t.id;command('music:track',t.id)}};
document.querySelector('#nextTrack').onclick=()=>{const t=pickRelativeTrack(1);if(t){document.querySelector('#trackSelect').value=t.id;command('music:track',t.id)}};
document.querySelector('#volume').oninput=e=>command('music:volume',+e.target.value/100);
document.querySelector('#muteBtn').onclick=()=>command('music:mute',!runtime.musicMuted);
document.querySelector('#shuffleToggle').onchange=e=>saveEventPatch({shufflePlaylist:e.target.checked});
document.querySelector('#loopToggle').onchange=e=>saveEventPatch({loopPlaylist:e.target.checked});
document.querySelector('#duckToggle').onchange=e=>saveEventPatch({duckSpecial:e.target.checked});

document.querySelector('#excludeCurrent').onclick=async()=>{
 const current=slides.find(s=>s.id===runtime?.currentSlideId);if(!current)return;
 if(!confirm('Exclude “'+current.title+'” from the deck?'))return;
 const list=currentSlides().filter(s=>s.id!==current.id);
 if(list.length)await command('slide:goto',list[0].id);
 const {id:slideId,...slideData}=current;await backend.putDoc(eventId,'slides',slideId,{...slideData,enabled:false});
};

document.querySelector('#emergencyHold').onclick=async()=>{
 if(holdEngaged){holdEngaged=false;renderState();await command('deck:play');return}
 await backend.mutateRuntime(eventId,r=>Object.assign(r,{playing:false,specialVisible:false,specialType:'none',musicCommand:'fade',musicCommandSeq:(r.musicCommandSeq||0)+1}));
 holdEngaged=true;renderState();
};

function enterFullscreen(){document.documentElement.requestFullscreen?.()}
function signOut(){auth.signOut().then(()=>location.reload())}
document.querySelector('#fullscreenBtn').onclick=enterFullscreen;
document.querySelector('#fullscreenBtnMobile').onclick=enterFullscreen;
document.querySelector('#signOutBtn').onclick=signOut;
document.querySelector('#signOutBtnMobile').onclick=signOut;
document.querySelector('#wakeBtn').onclick=async()=>{
 try{wakeLock=await navigator.wakeLock?.request('screen');document.querySelector('#wakeBtn').textContent='Director Awake'}
 catch{document.querySelector('#wakeBtn').textContent='Wake Lock Unavailable'}
};

function nextScheduleTime(item,now=new Date()){
 if(item.enabled===false)return null;
 if(item.kind==='daily'){
  const parts=String(item.timeOfDay||'00:00:00').split(':').map(Number),d=new Date(now);
  d.setHours(parts[0]||0,parts[1]||0,parts[2]||0,0);if(d<=now)d.setDate(d.getDate()+1);return d;
 }
 if(!item.runAt)return null;
 const d=item.runAt instanceof Date?item.runAt:new Date(item.runAt);
 return Number.isNaN(d.valueOf())||d<=now?null:d;
}
function renderNextCue(){
 const now=new Date();
 const upcoming=schedule.map(item=>({item,time:nextScheduleTime(item,now)})).filter(x=>x.time).sort((a,b)=>a.time-b.time)[0];
 const el=document.querySelector('#nextCue');if(!el)return;
 if(!upcoming){el.textContent='No scheduled cue';return}
 const secs=Math.max(0,Math.round((upcoming.time-now)/1000));
 const relative=secs<60?('in '+secs+'s'):secs<3600?('in '+Math.ceil(secs/60)+'m'):('at '+formatClock(upcoming.time,event?.clockFormat||'12'));
 el.textContent=(upcoming.item.label||upcoming.item.action)+' · '+relative;
}
function renderConnection(){
 const online=navigator.onLine,chip=document.querySelector('#connectionChip'),network=document.querySelector('#networkStatus');
 const label=!online?'Offline':runtime?'Synced':'Syncing…';
 chip.textContent=label;chip.classList.toggle('ok',online&&!!runtime);chip.classList.toggle('warn',!online);
 network.textContent=online?'Online':'Offline';
}
addEventListener('online',renderConnection);addEventListener('offline',renderConnection);renderConnection();

addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(e.key==='Escape'){setModeSheet(false);return}
 if(e.key==='ArrowLeft'){e.preventDefault();command('slide:prev')}
 if(e.key==='ArrowRight'){e.preventDefault();command('slide:next')}
 if(e.code==='Space'){e.preventDefault();command(runtime?.playing?'deck:pause':'deck:play')}
 if(e.key.toLowerCase()==='r')command('deck:restart');
 if(e.key.toLowerCase()==='o')command(runtime?.overlayVisible!==false?'overlay:hide':'overlay:show');
 if(e.key.toLowerCase()==='m')command('music:mute',!runtime?.musicMuted);
 if(e.key.toLowerCase()==='g')document.querySelector('#nextGraduate').click();
 if(e.key.toLowerCase()==='a')document.querySelector('#revealAward').click();
});

setInterval(()=>{
 document.querySelector('#liveClock').textContent=formatClock(new Date(),event?.clockFormat||'12');
 renderNextCue();
},1000);
