import {clamp} from './utils.js';

export function createAudioEngine(audios){
  let tracks=[];let event=null;let runtime=null;let current=0;let armed=false;let lastSeq=-1;let levelRaf=0;

  const enabledTracks=()=>tracks.filter(t=>t.enabled!==false);
  const setTracks=v=>tracks=v||[];

  function targetVolume(){
    const base=clamp(runtime?.musicVolume??.35,0,1);
    const shouldDuck=event?.duckSpecial!==false && runtime?.specialVisible && (runtime?.specialType==='graduate'||runtime?.specialType==='award');
    return shouldDuck?clamp(event?.duckVolume??.18,0,1):base;
  }
  function setEvent(v){
    event=v;
    for(const a of audios)a.loop=event?.loopPlaylist!==false;
    applyLevels(true);
  }
  function applyLevels(immediate=false){
    if(!runtime)return;
    const target=targetVolume();
    for(const a of audios)a.muted=!!runtime.musicMuted;
    if(immediate){for(let i=0;i<audios.length;i++)if(i===current||audios[i].paused===false)audios[i].volume=target;return}
    cancelAnimationFrame(levelRaf);
    const starts=audios.map(a=>a.volume),start=performance.now(),dur=260;
    const tick=t=>{const p=Math.min(1,(t-start)/dur);for(let i=0;i<audios.length;i++){if(!audios[i].paused)audios[i].volume=starts[i]+(target-starts[i])*p}if(p<1)levelRaf=requestAnimationFrame(tick)};
    levelRaf=requestAnimationFrame(tick);
  }
  const arm=()=>{armed=true;if(runtime?.musicCommand==='play')handle(runtime);return true};

  function setRuntime(v){
    runtime=v;if(!v)return;
    for(const a of audios){a.muted=!!v.musicMuted;a.loop=event?.loopPlaylist!==false}
    applyLevels(false);
    if(v.musicCommandSeq!==lastSeq){lastSeq=v.musicCommandSeq;handle(v)}
  }

  async function handle(v){
    if(!armed)return;
    const cmd=v.musicCommand;
    if(cmd==='pause'){audios.forEach(a=>a.pause());return}
    if(cmd==='stop'){audios.forEach(a=>{a.pause();a.currentTime=0});return}
    if(cmd==='fade'){fadeOut(audios[current],1200);return}
    if(cmd==='play'){
      const t=enabledTracks().find(x=>x.id===v.trackId);
      if(t?.url)await crossfade(t.url,event?.crossfadeSeconds??2.5);
    }
  }

  async function crossfade(url,seconds){
    const from=audios[current],to=audios[1-current];
    if(from.src===url&&!from.paused){applyLevels(false);return}
    to.src=url;to.currentTime=0;to.volume=0;to.muted=!!runtime?.musicMuted;to.loop=event?.loopPlaylist!==false;
    try{await to.play()}catch{return}
    const target=targetVolume(),start=performance.now(),dur=Math.max(.2,seconds)*1000;
    const tick=t=>{
      const p=Math.min(1,(t-start)/dur);
      to.volume=target*p;
      if(!from.paused)from.volume=target*(1-p);
      if(p<1)requestAnimationFrame(tick);
      else{from.pause();from.currentTime=0;current=1-current}
    };
    requestAnimationFrame(tick);
  }

  function fadeOut(a,dur){
    const start=performance.now(),vol=a.volume;
    const tick=t=>{const p=Math.min(1,(t-start)/dur);a.volume=vol*(1-p);if(p<1)requestAnimationFrame(tick);else{a.pause();a.currentTime=0}};
    requestAnimationFrame(tick);
  }

  return {setTracks,setEvent,setRuntime,arm,get armed(){return armed}};
}
