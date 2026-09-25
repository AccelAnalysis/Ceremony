import {esc,formatClock,msToCountdown} from './utils.js';

const anchors={
  'top-left':['0%','0%'],'top-center':['50%','0%'],'top-right':['100%','0%'],
  'center-left':['0%','50%'],'center':['50%','50%'],'center-right':['100%','50%'],
  'bottom-left':['0%','100%'],'bottom-center':['50%','100%'],'bottom-right':['100%','100%']
};

export function createHudController(){
  const clock=document.querySelector('#clockHud');
  const countdown=document.querySelector('#countdownHud');
  const special=document.querySelector('#specialOverlay');
  let event=null,runtime=null,graduates=[],awards=[];

  function applyLayout(el,layout={}){
    const [x,y]=anchors[layout.anchor]||anchors['top-right'];
    const ox=Number(layout.x||0),oy=Number(layout.y||0),scale=Number(layout.scale||1);
    el.style.left=`calc(${x} + ${ox}vw)`;el.style.top=`calc(${y} + ${oy}vh)`;
    const tx=x==='0%'?'0':x==='100%'?'-100%':'-50%';
    const ty=y==='0%'?'0':y==='100%'?'-100%':'-50%';
    el.style.transform=`translate(${tx},${ty}) scale(${scale})`;
    el.style.setProperty('--hud-bg',String(layout.bgOpacity??.5));
  }

  function setEvent(v){event=v;if(!v)return;applyLayout(clock,v.clockLayout);applyLayout(countdown,v.countdownLayout);document.querySelector('#countdownLabel').textContent=v.countdownLabel||'Ceremony Begins In'}
  function setPeople(g,a){graduates=g||[];awards=a||[];renderSpecial()}
  function setRuntime(v){runtime=v;if(!v)return;clock.classList.toggle('hidden',!v.clockVisible);countdown.classList.toggle('hidden',!v.countdownVisible);renderSpecial()}

  function renderSpecial(){
    if(!runtime)return;
    special.classList.toggle('hidden',!runtime.specialVisible);
    special.classList.remove('award-staged','award-revealed');
    if(!runtime.specialVisible)return;
    const card=document.querySelector('#specialCard');
    if(runtime.specialType==='message'){
      card.innerHTML=`<div class="kicker">AK9I Graduation Exercise</div><h2>${esc(runtime.messageText)}</h2>`;
    }else if(runtime.specialType==='graduate'){
      const g=graduates.find(x=>x.id===runtime.specialId);
      card.innerHTML=g?`<div class="kicker">Graduate Recognition</div><h2>${esc(g.name)}</h2><div class="sub">${esc(g.program||'')}${g.k9?` · ${esc(g.k9)}`:''}</div><p class="sub">${esc(g.statement||'')}</p>`:'<h2>Graduate</h2>';
    }else if(runtime.specialType==='award'){
      const a=awards.find(x=>x.id===runtime.specialId);
      special.classList.add(runtime.awardRevealed?'award-revealed':'award-staged');
      card.innerHTML=a?`<div class="kicker">AK9I Award Recognition</div><h2>${esc(a.name)}</h2><div class="recipient"><div class="sub" style="font-size:clamp(30px,5vw,72px);font-weight:800">${esc(a.recipient)}</div><p class="sub">${esc(a.citation||'')}</p></div>`:'<h2>Award</h2>';
    }else card.innerHTML='';
  }

  function tick(now=new Date()){
    if(!event||!runtime)return;
    const cv=formatClock(now,event.clockFormat);const ce=document.querySelector('#clockValue');if(ce.textContent!==cv)ce.textContent=cv;
    if(event.ceremonyStartAt){const text=msToCountdown(new Date(event.ceremonyStartAt)-now);const el=document.querySelector('#countdownValue');if(el.textContent!==text)el.textContent=text}
  }
  return {setEvent,setPeople,setRuntime,tick};
}