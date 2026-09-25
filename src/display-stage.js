export function createStageRenderer(stage){
  const els=new Map();
  let slides=[];
  let runtime=null;
  let renderedSlideId='';
  let transitionTimer=0;
  let transitionSeq=0;

  function sync(nextSlides,nextRuntime,event){
    slides=nextSlides||[];
    runtime=nextRuntime||runtime;
    const existing=new Set();
    for(const s of slides){
      existing.add(s.id);
      let el=els.get(s.id);
      if(!el){
        el=document.createElement('section');
        el.className='slide';
        el.dataset.id=s.id;
        el.innerHTML='<div class="media"></div><div class="shade"></div><div class="cinema"></div><div class="copy"><div class="eyebrow"></div><h1></h1><div class="gold-rule"></div><p></p></div>';
        stage.appendChild(el);
        els.set(s.id,el);
      }
      el.className=`slide ${s.align||'left'} effect-${s.effect||'vignette'}${runtime?.motionEnabled===false?'':` motion motion-${s.motion||'a'}`}`;el.dataset.transition=s.transition||'fade';
      let media=el.querySelector('.media');
      if(s.mediaType==='video'){
        if(media.tagName!=='VIDEO'){
          const v=document.createElement('video');
          v.className='media';v.autoplay=false;v.muted=true;v.loop=true;v.playsInline=true;v.preload='metadata';
          media.replaceWith(v);media=v;
        }
        if(media.src!==s.mediaUrl)media.src=s.mediaUrl||'';
        media.style.objectPosition=s.position||'center center';
      }else{
        if(media.tagName==='VIDEO'){
          const d=document.createElement('div');d.className='media';media.replaceWith(d);media=d;
        }
        media.style.backgroundImage=`url("${String(s.mediaUrl||'').replaceAll('"','%22')}")`;
        media.style.backgroundPosition=s.position||'center center';
      }
      el.querySelector('.eyebrow').textContent=s.eyebrow||'';
      el.querySelector('h1').textContent=s.title||'';
      el.querySelector('p').textContent=s.sub||'';
    }
    for(const [id,el] of els){if(!existing.has(id)){el.remove();els.delete(id)}}
    if(runtime?.currentSlideId)show(runtime.currentSlideId,event,true);
  }

  function show(id,event,immediate=false){
    if(!id||(id===renderedSlideId&&!immediate))return;
    const incoming=els.get(id);if(!incoming)return;
    clearTimeout(transitionTimer);
    const seq=++transitionSeq;
    const outgoing=renderedSlideId?els.get(renderedSlideId):null;
    renderedSlideId=id;
    const ms=(event?.transitionSeconds??1.4)*1000;
    document.documentElement.style.setProperty('--transition',`${ms}ms`);
    const incomingVideo=incoming.querySelector('video.media');
    if(incomingVideo)incomingVideo.play().catch(()=>{});
    if(outgoing&&outgoing!==incoming&&!immediate){
      const transition=incoming.dataset.transition||'fade';
      outgoing.classList.add('leaving');incoming.classList.add('active',`enter-${transition}`);
      transitionTimer=setTimeout(()=>{if(seq!==transitionSeq)return;outgoing.classList.remove('active','leaving');incoming.classList.remove(`enter-${transition}`);const oldVideo=outgoing.querySelector('video.media');if(oldVideo)oldVideo.pause()},ms+50);
    }else{
      for(const el of els.values()){
        el.classList.remove('active','leaving','enter-fade','enter-zoom','enter-left','enter-right','enter-up','enter-blur','enter-wipe');
        if(el!==incoming){const v=el.querySelector('video.media');if(v)v.pause()}
      }
      incoming.classList.add('active');
    }
  }

  function applyRuntime(next,event){
    const prev=runtime;runtime=next;
    for(const el of els.values()){
      const s=slides.find(x=>x.id===el.dataset.id);
      el.classList.toggle('motion',next.motionEnabled!==false);
      for(const m of ['a','b','c','d'])el.classList.toggle(`motion-${m}`,next.motionEnabled!==false&&(s?.motion||'a')===m);
    }
    if(next.currentSlideId!==prev?.currentSlideId)show(next.currentSlideId,event,false);
  }

  function titleFor(id){return slides.find(s=>s.id===id)?.title||id||''}
  return {sync,show,applyRuntime,titleFor,get transitionSequence(){return transitionSeq}};
}