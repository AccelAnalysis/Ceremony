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

const panel=document.querySelector('#displayPanel');
const setup=document.querySelector('#displaySetup');
const closePanel=document.querySelector('#closeDisplayPanel');
const status=document.querySelector('#displayStatus');
const credits=document.querySelector('#creditsOverlay');
let event=null,runtime=null,slides=[],graduates=[],awards=[],lastVersion=-1,wakeLock=null;
let chromeTimer=0,cursorTimer=0;

backend.subscribeEvent(eventId,v=>{
 event=v;
 if(!v){status.textContent='Event not found.';return}
 document.documentElement.style.setProperty('--overlay',String(v.overlayOpacity??.58));
 document.documentElement.style.setProperty('--cinema-intensity',String(v.cinemaIntensity??.72));
 hud.setEvent(v);audio.setEvent(v);renderer.sync(slides,runtime,v);renderCredits();
 if(runtime)applyRuntime(runtime);
});
backend.subscribeCollection(eventId,'slides',v=>{slides=v;renderer.sync(v,runtime,event)});
backend.subscribeCollection(eventId,'graduates',v=>{graduates=v;hud.setPeople(graduates,awards)});
backend.subscribeCollection(eventId,'awards',v=>{awards=v;hud.setPeople(graduates,awards)});
backend.subscribeCollection(eventId,'tracks',v=>audio.setTracks(v));
backend.subscribeRuntime(eventId,v=>{
 if(!v||(v.stateVersion??0)<lastVersion)return;
 lastVersion=v.stateVersion??0;runtime=v;applyRuntime(v);
});

function applyRuntime(v){
 document.documentElement.style.setProperty('--overlay',v.overlayVisible===false?'0':String(event?.overlayOpacity??.58));
 document.body.classList.toggle('captions-off',v.captionsVisible===false);
 document.body.classList.toggle('cinema-off',v.cinemaVisible===false||event?.cinemaEnabled===false);
 document.querySelector('#brandBug').classList.toggle('hidden',v.brandVisible===false);
 document.querySelector('#progress').classList.toggle('hidden',v.progressVisible===false);
 renderer.applyRuntime(v,event);
 hud.setRuntime(v);
 audio.setRuntime(v);
 status.textContent=renderer.titleFor(v.currentSlideId);
}

setInterval(()=>hud.tick(new Date()),1000);
function progressFrame(){
 if(event&&runtime?.playing&&runtime.currentSlideId){
  const s=slides.find(x=>x.id===runtime.currentSlideId);
  const duration=(s?.duration>0?s.duration:event.defaultDuration||10)*1000;
  const start=runtime.slideStartedAt?new Date(runtime.slideStartedAt).getTime():Date.now();
  const p=Math.min(1,Math.max(0,(Date.now()-start)/duration));
  document.querySelector('#progress span').style.width=`${p*100}%`;
 }
 requestAnimationFrame(progressFrame);
}
requestAnimationFrame(progressFrame);

function panelOpen(){return !panel.classList.contains('hidden')}
function revealChrome(ms=1800){
 document.body.classList.add('display-chrome-visible');
 document.body.classList.remove('cursor-hidden');
 clearTimeout(chromeTimer);
 if(!panelOpen())chromeTimer=setTimeout(()=>document.body.classList.remove('display-chrome-visible'),ms);
}
function setPanel(open){
 panel.classList.toggle('hidden',!open);
 document.body.classList.toggle('display-panel-open',open);
 setup.setAttribute('aria-expanded',String(open));
 if(open){revealChrome(60000);closePanel.focus()}
 else{document.body.classList.remove('display-panel-open');revealChrome(1100)}
}
function scheduleCursorHide(){
 clearTimeout(cursorTimer);
 cursorTimer=setTimeout(()=>{
  if(!panelOpen()&&credits.classList.contains('hidden')){
   document.body.classList.add('cursor-hidden');
   document.body.classList.remove('display-chrome-visible');
  }
 },1800);
}
function notePointerActivity(e){
 document.body.classList.remove('cursor-hidden');
 scheduleCursorHide();
 const nearCorner=e.clientX>=innerWidth-130&&e.clientY>=innerHeight-130;
 if(nearCorner)revealChrome();
}
addEventListener('pointermove',notePointerActivity,{passive:true});
addEventListener('pointerdown',()=>{document.body.classList.remove('cursor-hidden');scheduleCursorHide()},{passive:true});
scheduleCursorHide();

setup.addEventListener('pointerenter',()=>revealChrome());
setup.addEventListener('focus',()=>revealChrome(5000));
setup.onclick=()=>setPanel(!panelOpen());
closePanel.onclick=()=>setPanel(false);
document.querySelector('#stage').onclick=()=>{if(panelOpen())setPanel(false)};

document.querySelector('#armAudio').onclick=()=>{audio.arm();status.textContent='Audio armed'};
document.querySelector('#keepAwakeBtn').onclick=async()=>{
 try{
  wakeLock=await navigator.wakeLock?.request('screen');
  document.querySelector('#keepAwakeBtn').textContent='Display Awake';
 }catch{
  document.querySelector('#keepAwakeBtn').textContent='Wake Lock Unavailable';
 }
};
document.querySelector('#fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();
document.querySelector('#signOutBtn').onclick=()=>auth.signOut().then(()=>location.reload());

function renderCredits(){
 const list=document.querySelector('#creditsList');if(!list)return;
 list.innerHTML=slides.filter(s=>s.creditUrl).map(s=>`<a href="${s.creditUrl}" target="_blank" rel="noopener">${s.order||''} · ${s.title||s.id}</a>`).join('')||'<div class="muted">No credits are recorded for this event.</div>';
}
document.querySelector('#creditsBtn').onclick=()=>{
 credits.classList.remove('hidden');
 setPanel(false);
 document.body.classList.remove('cursor-hidden');
};
document.querySelector('#closeCredits').onclick=()=>{
 credits.classList.add('hidden');
 revealChrome(1000);
 scheduleCursorHide();
};

addEventListener('visibilitychange',async()=>{
 if(document.visibilityState==='visible'&&wakeLock===null&&document.querySelector('#keepAwakeBtn').textContent==='Display Awake'){
  try{wakeLock=await navigator.wakeLock?.request('screen')}catch{}
 }
});
addEventListener('keydown',e=>{
 const key=e.key.toLowerCase();
 if(key==='f')document.documentElement.requestFullscreen?.();
 if(key==='d'){e.preventDefault();revealChrome(5000);setPanel(!panelOpen())}
 if(e.key==='Escape'){
  if(!credits.classList.contains('hidden'))credits.classList.add('hidden');
  if(panelOpen())setPanel(false);
  revealChrome(800);scheduleCursorHide();
 }
});
