import {mountAuthGate} from './auth-ui.js';
import {getBackend,demoMode} from './backend.js';
import {eventIdFromUrl,rememberEventId,esc} from './utils.js';
import {notice} from './editor-helpers.js';
import {renderEventPanel} from './editor-event.js';
import {renderSlidesPanel} from './editor-slides.js';
import {renderGraduatePanel,renderAwardPanel,renderMusicPanel} from './editor-records.js';
import {renderSchedulePanel} from './editor-schedule.js';
import {renderVisualPanel} from './editor-visual.js';
import {renderDataPanel} from './editor-data.js';

const eventId=eventIdFromUrl();rememberEventId(eventId);
await mountAuthGate({title:'Event Editor',subtitle:`Configure ${eventId}`,allowSignUp:true});
const {backend,auth}=await getBackend();
const state={event:null,runtime:null,slides:[],categories:[],graduates:[],awards:[],tracks:[],schedule:[]};
const ctx={eventId,backend,auth,demoMode,state};
const panels=[...document.querySelectorAll('.editor-panel')],nav=document.querySelector('#editorNav');

document.querySelector('#directorLink').href=`../control/?event=${encodeURIComponent(eventId)}`;
document.querySelector('#displayLink').href=`../display/?event=${encodeURIComponent(eventId)}`;
document.querySelector('#signOutBtn').onclick=()=>auth.signOut().then(()=>location.reload());
nav.onclick=e=>{const b=e.target.closest('[data-panel]');if(!b)return;nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));panels.forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==b.dataset.panel));render(b.dataset.panel)};

let detailSubscriptionsStarted=false;
backend.subscribeEvent(eventId,v=>{state.event=v;document.querySelector('#eventName').textContent=v?.name||'Event not initialized';if(v&&!detailSubscriptionsStarted){detailSubscriptionsStarted=true;for(const name of ['slides','categories','graduates','awards','tracks','schedule'])backend.subscribeCollection(eventId,name,items=>{state[name]=items;renderActive()});backend.subscribeRuntime(eventId,r=>{state.runtime=r;renderActive()})}renderActive()});

function active(){return panels.find(p=>!p.classList.contains('hidden'))?.dataset.panel||'event'}
function renderActive(){render(active())}
function render(kind){const p=panels.find(x=>x.dataset.panel===kind);if(!p)return;if(!state.event&&kind!=='data'){p.innerHTML=`<h2 class="section-title">Event not initialized</h2>${notice(`Create <b>${esc(eventId)}</b> from Setup / Data first.`)}`;return}const fn={event:renderEventPanel,slides:renderSlidesPanel,people:renderGraduatePanel,awards:renderAwardPanel,music:renderMusicPanel,schedule:renderSchedulePanel,visual:renderVisualPanel,data:renderDataPanel}[kind];fn?.(p,ctx)}
render('event');