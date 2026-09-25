import {clamp} from './utils.js';
export function createAudioEngine(audios){
  let tracks=[];let event=null;let runtime=null;let current=0;let armed=false;let lastSeq=-1;
  const setTracks=v=>tracks=v||[];
  const setEvent=v=>event=v;
  const arm=()=>{armed=true;return true};
  function setRuntime(v){runtime=v;if(!v)return;for(const a of audios){a.volume=clamp(v.musicVolume??.35,0,1);a.muted=!!v.musicMuted}if(v.musicCommandSeq!==lastSeq){lastSeq=v.musicCommandSeq;handle(v)}}
  async function handle(v){if(!armed)return;const cmd=v.musicCommand;if(cmd==='pause'){audios.forEach(a=>a.pause());return}if(cmd==='stop'){audios.forEach(a=>{a.pause();a.currentTime=0});return}if(cmd==='fade'){fadeOut(audios[current],1200);return}if(cmd==='play'){const t=tracks.find(x=>x.id===v.trackId);if(t?.url)await crossfade(t.url,event?.crossfadeSeconds??2.5)}}
  async function crossfade(url,seconds){const from=audios[current],to=audios[1-current];to.src=url;to.currentTime=0;to.volume=0;to.muted=!!runtime?.musicMuted;try{await to.play()}catch{return}const target=clamp(runtime?.musicVolume??.35,0,1),start=performance.now(),dur=Math.max(.2,seconds)*1000;const tick=t=>{const p=Math.min(1,(t-start)/dur);to.volume=target*p;from.volume=target*(1-p);if(p<1)requestAnimationFrame(tick);else{from.pause();from.currentTime=0;current=1-current}};requestAnimationFrame(tick)}
  function fadeOut(a,dur){const start=performance.now(),vol=a.volume;const tick=t=>{const p=Math.min(1,(t-start)/dur);a.volume=vol*(1-p);if(p<1)requestAnimationFrame(tick);else a.pause()};requestAnimationFrame(tick)}
  return {setTracks,setEvent,setRuntime,arm,get armed(){return armed}};
}