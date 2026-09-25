import {clamp} from './utils.js';
export const MODE_LABELS={pre:'Pre-Show Loop',ceremony:'Ceremony Manual',graduates:'Graduate Recognition',awards:'Award Reveal',post:'Post-Show Loop'};
export const MODE_AUTO={pre:true,ceremony:false,graduates:false,awards:false,post:true};
export function activeSlides(slides,categories,mode){const cat=new Map(categories.map(c=>[c.id,c]));return [...slides].filter(s=>s.enabled!==false&&(cat.get(s.categoryId)?.enabled!==false)&&(s.modes?.[mode]!==false)).sort((a,b)=>(a.order||0)-(b.order||0))}
export function nextSlideId(runtime,slides,direction=1){if(!slides.length)return'';let i=slides.findIndex(s=>s.id===runtime.currentSlideId);if(i<0)i=direction>0?-1:0;return slides[(i+direction+slides.length)%slides.length].id}
export function actionPatch(action,arg,runtime,ctx={}){
 const p={}; const slides=ctx.slides||[]; const event=ctx.event||{};
 switch(action){
  case'mode:pre':case'mode:ceremony':case'mode:graduates':case'mode:awards':case'mode:post':{const mode=action.split(':')[1];p.mode=mode;p.specialVisible=false;p.specialType='none';const list=ctx.slidesByMode?.[mode]||slides;if(list.length&&!list.some(s=>s.id===runtime.currentSlideId))p.currentSlideId=list[0].id;if(event.autoCueMusic&&event.modeTrackIds?.[mode]){p.trackId=event.modeTrackIds[mode];p.musicCommand='play';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1}break}
  case'deck:play':p.playing=true;break;case'deck:pause':p.playing=false;break;case'deck:restart':if(slides.length)p.currentSlideId=slides[0].id;break;case'slide:next':p.currentSlideId=nextSlideId(runtime,slides,1);break;case'slide:prev':p.currentSlideId=nextSlideId(runtime,slides,-1);break;case'slide:goto':if(slides.some(s=>s.id===arg))p.currentSlideId=arg;break;
  case'clock:show':p.clockVisible=true;break;case'clock:hide':p.clockVisible=false;break;case'countdown:show':p.countdownVisible=true;break;case'countdown:hide':p.countdownVisible=false;break;
  case'overlay:show':p.overlayVisible=true;break;case'overlay:hide':p.overlayVisible=false;break;
  case'captions:show':p.captionsVisible=true;break;case'captions:hide':p.captionsVisible=false;break;
  case'brand:show':p.brandVisible=true;break;case'brand:hide':p.brandVisible=false;break;
  case'motion:show':p.motionEnabled=true;break;case'motion:hide':p.motionEnabled=false;break;
  case'progress:show':p.progressVisible=true;break;case'progress:hide':p.progressVisible=false;break;
  case'cinema:show':p.cinemaVisible=true;break;case'cinema:hide':p.cinemaVisible=false;break;
  case'message:show':p.specialType='message';p.specialVisible=true;p.messageText=String(arg||'');break;case'message:hide':p.specialVisible=false;p.specialType='none';break;
  case'graduate:show':p.specialType='graduate';p.specialVisible=true;p.specialId=String(arg||runtime.specialId||'');break;case'graduate:hide':p.specialVisible=false;p.specialType='none';break;
  case'award:stage':p.specialType='award';p.specialVisible=true;p.specialId=String(arg||runtime.specialId||'');p.awardRevealed=false;break;case'award:reveal':p.specialType='award';p.specialVisible=true;p.specialId=String(arg||runtime.specialId||'');p.awardRevealed=true;break;case'award:hide':p.specialVisible=false;p.specialType='none';p.awardRevealed=false;break;
  case'music:play':p.musicCommand='play';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1;if(arg)p.trackId=String(arg);break;case'music:pause':p.musicCommand='pause';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1;break;case'music:fade':p.musicCommand='fade';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1;break;case'music:stop':p.musicCommand='stop';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1;break;case'music:track':p.trackId=String(arg||'');p.musicCommand='play';p.musicCommandSeq=(runtime.musicCommandSeq||0)+1;break;
  case'music:volume':p.musicVolume=clamp(Number(arg),0,1);break;case'music:mute':p.musicMuted=arg===true||String(arg).toLowerCase()==='true';break;
 }
 return p;
}
export function applyPatch(runtime,patch){return Object.assign(runtime,patch)}
