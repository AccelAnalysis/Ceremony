import {actionPatch,activeSlides} from './state.js';
function pad(n){return String(n).padStart(2,'0')}
function dayKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function dailyTarget(now,time){const [h,m,s='0']=(time||'00:00').split(':');const d=new Date(now);d.setHours(+h||0,+m||0,+s||0,0);return d}
export function startScheduler({eventId,backend,getSnapshot,onExecution}){
 let stopped=false,busy=false;
 const tick=async()=>{if(stopped||busy)return;const snap=getSnapshot();if(!snap?.event?.scheduleEnabled)return;const now=new Date();busy=true;try{for(const item of snap.schedule||[]){if(!item.enabled)continue;let due=false,key=item.id,target=null;if(item.kind==='once'&&item.runAt){target=new Date(item.runAt);key=item.id}else if(item.kind==='daily'&&item.timeOfDay){target=dailyTarget(now,item.timeOfDay);key=`${item.id}_${dayKey(now)}`}if(!target)continue;const delta=now-target;if(delta<0)continue;const catchUp=item.catchUp??snap.event.catchUp;if(!catchUp&&delta>65000)continue;due=true;if(!due)continue;const slidesByMode={};for(const mode of ['pre','ceremony','graduates','awards','post'])slidesByMode[mode]=activeSlides(snap.slides,snap.categories,mode);const currentSlides=slidesByMode[snap.runtime.mode]||[];const claimed=await backend.claimSchedule(eventId,key,r=>Object.assign(r,actionPatch(item.action,item.argument,r,{event:snap.event,slides:currentSlides,slidesByMode})));if(claimed)onExecution?.(item)}}finally{busy=false}};
 const timer=setInterval(tick,1000);tick();return()=>{stopped=true;clearInterval(timer)}
}
