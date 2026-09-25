import {input,num,clamp,layoutValue,toast} from './editor-helpers.js';
const anchors=['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'];
function block(name,key,l={}){return `<fieldset><legend>${name}</legend><div class="form-grid"><div class="field"><label>Anchor</label><select data-k="${key}" data-f="anchor">${anchors.map(a=>`<option ${a===l.anchor?'selected':''}>${a}</option>`).join('')}</select></div>${input('X offset (vw)',l.x??0,'number',`data-k="${key}" data-f="x" min="-50" max="50" step="0.5"`)}${input('Y offset (vh)',l.y??0,'number',`data-k="${key}" data-f="y" min="-50" max="50" step="0.5"`)}${input('Scale',l.scale??1,'number',`data-k="${key}" data-f="scale" min="0.25" max="3" step="0.05"`)}${input('Background opacity',l.bgOpacity??.5,'number',`data-k="${key}" data-f="bgOpacity" min="0" max="1" step="0.05"`)}</div></fieldset>`}

export function renderVisualPanel(p,ctx){
 const e=ctx.state.event;
 p.innerHTML=`<h2 class="section-title">Visuals, Clock & Countdown</h2>
 <p class="section-sub">Global image treatment plus independently positioned event clock and countdown.</p>
 <fieldset><legend>Layered cinematic treatment</legend><div class="form-grid">
   ${input('Overlay opacity',e.overlayOpacity??.58,'number','id="overlayOpacityVisual" min="0" max="1" step="0.01"')}
   ${input('Cinematic intensity',e.cinemaIntensity??.72,'number','id="cinemaIntensity" min="0" max="1" step="0.01"')}
   <div class="field check"><label><input id="cinemaEnabled" type="checkbox" ${e.cinemaEnabled!==false?'checked':''}> Cinematic layers enabled</label></div>
 </div><p class="muted">Cinematic layers include each slide’s vignette / sweep / focus treatment plus film grain and text reveal. The Event Director can temporarily hide these layers live.</p></fieldset>
 <div class="hud-grid">${block('Event Clock','clockLayout',e.clockLayout)}${block('Countdown','countdownLayout',e.countdownLayout)}</div>
 ${input('Countdown label',e.countdownLabel||'Ceremony Begins In','text','id="countdownLabel"')}
 <div class="toolbar"><button class="btn primary" id="saveVisual">Save visual settings</button></div>`;
 p.querySelector('#saveVisual').onclick=async()=>{
  const read=k=>{const q=f=>layoutValue(p,k,f);return{anchor:q('anchor').value,x:clamp(num(q('x').value),-50,50),y:clamp(num(q('y').value),-50,50),scale:clamp(num(q('scale').value,1),.25,3),bgOpacity:clamp(num(q('bgOpacity').value,.5),0,1)}};
  await ctx.backend.updateEvent(ctx.eventId,{
   overlayOpacity:clamp(num(p.querySelector('#overlayOpacityVisual').value,.58),0,1),
   cinemaEnabled:p.querySelector('#cinemaEnabled').checked,
   cinemaIntensity:clamp(num(p.querySelector('#cinemaIntensity').value,.72),0,1),
   clockLayout:read('clockLayout'),countdownLayout:read('countdownLayout'),
   countdownLabel:p.querySelector('#countdownLabel').value.trim().slice(0,100)
  });
  toast('Visual settings saved');
 };
}
