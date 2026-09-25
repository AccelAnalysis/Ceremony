import {input,num,clamp,layoutValue,toast} from './editor-helpers.js';

const anchors=['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'];
const anchorSymbols={'top-left':'↖','top-center':'↑','top-right':'↗','center-left':'←','center':'•','center-right':'→','bottom-left':'↙','bottom-center':'↓','bottom-right':'↘'};

function anchorPicker(key,current){
 return '<input type="hidden" data-k="'+key+'" data-f="anchor" value="'+current+'"><div class="anchor-picker" data-anchor-picker="'+key+'">'+anchors.map(a=>'<button type="button" class="anchor-button '+(a===current?'active':'')+'" data-anchor="'+a+'" aria-label="'+a.replaceAll('-',' ')+'" aria-pressed="'+String(a===current)+'">'+anchorSymbols[a]+'</button>').join('')+'</div>';
}
function rangeField(label,key,field,value,min,max,step){
 return '<div class="range-field"><label>'+label+' <span data-range-value></span></label><input type="range" data-k="'+key+'" data-f="'+field+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></div>';
}
function block(name,key,l={}){
 const anchor=anchors.includes(l.anchor)?l.anchor:'center';
 return '<fieldset><legend>'+name+'</legend><div class="form-grid"><div class="field"><label>Position</label>'+anchorPicker(key,anchor)+'</div>'+rangeField('Size',key,'scale',l.scale??1,.25,3,.05)+rangeField('Background',key,'bgOpacity',l.bgOpacity??.5,0,1,.05)+'</div><details class="fine-position"><summary>Fine position</summary><div class="form-grid">'+input('X offset (vw)',l.x??0,'number','data-k="'+key+'" data-f="x" min="-50" max="50" step="0.5"')+input('Y offset (vh)',l.y??0,'number','data-k="'+key+'" data-f="y" min="-50" max="50" step="0.5"')+'</div></details></fieldset>';
}
function visualRange(label,id,value){
 return '<div class="range-field"><label>'+label+' <span data-range-value></span></label><input id="'+id+'" type="range" min="0" max="1" step="0.01" value="'+value+'"></div>';
}
function wireRangeLabels(root){
 root.querySelectorAll('.range-field input[type="range"]').forEach(r=>{
  const out=r.closest('.range-field').querySelector('[data-range-value]');
  const paint=()=>{out.textContent=Math.round(Number(r.value)*100)+'%'};
  r.addEventListener('input',paint);paint();
 });
}

export function renderVisualPanel(p,ctx){
 const e=ctx.state.event;
 p.innerHTML='<h2 class="section-title">Visuals, Clock & Countdown</h2>'+
 '<p class="section-sub">Control the global cinematic treatment, then place the clock and countdown visually instead of working from raw coordinates.</p>'+
 '<fieldset><legend>Cinematic treatment</legend><div class="form-grid">'+
 visualRange('Overlay opacity','overlayOpacityVisual',e.overlayOpacity??.58)+
 visualRange('Cinematic intensity','cinemaIntensity',e.cinemaIntensity??.72)+
 '<div class="field check"><label><input id="cinemaEnabled" type="checkbox" '+(e.cinemaEnabled!==false?'checked':'')+'> Cinematic layers enabled</label></div>'+
 '</div><p class="muted">The Event Director can temporarily hide these layers live without changing these saved defaults.</p></fieldset>'+
 '<div class="hud-grid">'+block('Event Clock','clockLayout',e.clockLayout)+block('Countdown','countdownLayout',e.countdownLayout)+'</div>'+
 input('Countdown label',e.countdownLabel||'Ceremony Begins In','text','id="countdownLabel"')+
 '<div class="toolbar"><button class="btn primary" id="saveVisual">Save visual settings</button></div>';

 p.querySelectorAll('[data-anchor-picker]').forEach(grid=>grid.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-anchor]');if(!b)return;
  const key=grid.dataset.anchorPicker,hidden=p.querySelector('[data-k="'+key+'"][data-f="anchor"]');
  hidden.value=b.dataset.anchor;
  grid.querySelectorAll('[data-anchor]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});
 }));
 wireRangeLabels(p);

 p.querySelector('#saveVisual').onclick=async()=>{
  const read=k=>{const q=f=>layoutValue(p,k,f);return{anchor:q('anchor').value,x:clamp(num(q('x').value),-50,50),y:clamp(num(q('y').value),-50,50),scale:clamp(num(q('scale').value,1),.25,3),bgOpacity:clamp(num(q('bgOpacity').value,.5),0,1)}};
  await ctx.backend.updateEvent(ctx.eventId,{
   overlayOpacity:clamp(num(p.querySelector('#overlayOpacityVisual').value,.58),0,1),
   cinemaEnabled:p.querySelector('#cinemaEnabled').checked,
   cinemaIntensity:clamp(num(p.querySelector('#cinemaIntensity').value,.72),0,1),
   clockLayout:read('clockLayout'),
   countdownLayout:read('countdownLayout'),
   countdownLabel:p.querySelector('#countdownLabel').value.trim().slice(0,100)
  });
  toast('Visual settings saved');
 };
}
