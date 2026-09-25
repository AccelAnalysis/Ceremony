import {mountAuthGate} from './auth-ui.js';
import {getBackend} from './backend.js';
import {eventIdFromUrl,rememberEventId} from './utils.js';
import {createStageRenderer} from './display-stage.js';
import {createHudController} from './display-hud.js';
import {createAudioEngine} from './audio-engine.js';

const eventId=eventIdFromUrl();rememberEventId(eventId);
await mountAuthGate({title:'Audience Display',allowSignUp:false,subtitle:`Sign in to event ${eventId}`});
const {backend,auth}=await getBackend();
const renderer=createStageRenderer(document.querySelector('#stage'));
const hud=createHudController();
const audio=createAudioEngine([document.querySelector('#audioA'),document.querySelector('#audioB')]);
const panel=document.querySelector('#displayPanel'),status=document.querySelector('#displayStatus');
let event=null,runtime=null,slides=[],graduates=[],awards=[],lastVersion=-1,wakeLock=null;

backend.subscribeEvent(eventId,v=>{event=v;if(!v){status.textContent='Event not found.';return}document.documentElement.style.setProperty('--overlay',String(v.overlayOpacity??.58));document.documentElement.style.setProperty('--cinema-intensity',String(v.cinemaIntensity??.72));hud.setEvent(v);audio.setEvent(v);renderer.sync(slides,runtime,v);renderCredits();if(runtime)applyRuntime(runtime)});
backend.subscribeCollection(eventId,'slides',v=>{slides=v;renderer.sync(v,runtime,event)});
backend.subscribeCollection(eventId,'graduates',v=>{graduates=v;hud.setPeople(graduates,awards)});
backend.subscribeCollection(eventId,'awards',v=>{awards=v;hud.setPeople(graduates,awards)});
backend.subscribeCollection(eventId,'tracks',v=>audio.setTracks(v));
backend.subscribeRuntime(eventId,v=>{if(!v||(v.stateVersion??0)<lastVersion)return;lastVersion=v.stateVersion??0;runtime=v;applyRuntime(v)});

function applyRuntime(v){
  document.documentElement.style.setProperty('--overlay',v.overlayVisible===false?'0':String(event?.overlayOpacity??.58));
  document.body.classList.toggle('captions-off',v.captionsVisible===false);
  document.body.classList.toggle('cinema-off',v.cinemaVisible===false||event?.cinemaEnabled===false);
  document.querySelector('#brandBug').classList.toggle('hidden',v.brandVisible===false);
  document.querySelector('#progress').classList.toggle('hidden',v.progressVisible===false);
  renderer.applyRuntime(v,event);hud.setRuntime(v);audio.setRuntime(v);status.textContent=renderer.titleFor(v.currentSlideId);
}

setInterval(()=>hud.tick(new Date()),1000);
function progressFrame(){if(event&&runtime?.playing&&runtime.currentSlideId){const s=slides.find(x=>x.id===runtime.currentSlideId),duration=(s?.duration>0?s.duration:event.defaultDuration||10)*1000,start=runtime.slideStartedAt?new Date(runtime.slideStartedAt).getTime():Date.now(),p=Math.min(1,Math.max(0,(Date.now()-start)/duration));document.querySelector('#progress span').style.width=`${p*100}%`}requestAnimationFrame(progressFrame)}requestAnimationFrame(progressFrame);

document.querySelector('#displaySetup').onclick=()=>panel.classList.toggle('hidden');
document.querySelector('#armAudio').onclick=()=>{audio.arm();status.textContent='Audio armed'};
document.querySelector('#keepAwakeBtn').onclick=async()=>{try{wakeLock=await navigator.wakeLock?.request('screen');document.querySelector('#keepAwakeBtn').textContent='Display Awake'}catch{document.querySelector('#keepAwakeBtn').textContent='Wake Lock Unavailable'}};
document.querySelector('#fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();
document.querySelector('#signOutBtn').onclick=()=>auth.signOut().then(()=>location.reload());
function renderCredits(){const list=document.querySelector('#creditsList');if(!list)return;list.innerHTML=slides.filter(s=>s.creditUrl).map(s=>`<a href="${s.creditUrl}" target="_blank" rel="noopener">${s.order||''} · ${s.title||s.id}</a>`).join('')||'<div class="muted">No credits are recorded for this event.</div>'}
document.querySelector('#creditsBtn').onclick=()=>document.querySelector('#creditsOverlay').classList.remove('hidden');
document.querySelector('#closeCredits').onclick=()=>document.querySelector('#creditsOverlay').classList.add('hidden');
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f')document.documentElement.requestFullscreen?.()});