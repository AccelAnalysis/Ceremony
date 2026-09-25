import {input,modal,closeOnCancel,num,clamp,esc,toast} from './editor-helpers.js';
import {uid} from './utils.js';
import {MODE_KEYS} from './seed-data.js';

export function renderSlidesPanel(p,ctx){
 const {slides,categories}=ctx.state;const catOpts=categories.map(c=>[c.id,c.name]);
 p.innerHTML=`<div class="panel-head"><div><h2 class="section-title">Slides · ${slides.length}</h2><p class="section-sub">Edit image/video URLs, timing, category conditions, modes, and cinematic treatment.</p></div><div class="toolbar"><button class="btn" id="includeAll">Include all slides</button><button class="btn primary" id="addSlide">Add slide</button></div></div><div class="item-list">${slides.map(s=>`<article class="item-card" data-id="${esc(s.id)}"><div class="item-card-head"><div><b>${String(s.order).padStart(2,'0')} · ${esc(s.title)}</b><div class="meta">${esc(s.mediaType||'image')} · ${esc(categories.find(c=>c.id===s.categoryId)?.name||s.categoryId||'')} · ${s.enabled===false?'excluded':'included'}</div></div><div class="toolbar"><button class="btn edit">Edit</button><button class="btn duplicate">Duplicate</button><button class="btn danger remove">Remove</button></div></div></article>`).join('')}</div>`;
 p.querySelector('#includeAll').onclick=async()=>{const excluded=slides.filter(s=>s.enabled===false);for(const s of excluded){const {id,...data}=s;await ctx.backend.putDoc(ctx.eventId,'slides',id,{...data,enabled:true})}toast(excluded.length?'All slides included':'All slides were already included')};
 p.querySelector('#addSlide').onclick=()=>openSlide({id:uid('slide'),order:(slides.at(-1)?.order||0)+1,title:'New Slide',eyebrow:'AK9I',sub:'',mediaType:'image',mediaUrl:'',creditUrl:'',align:'left',position:'center center',transition:'fade',motion:'a',effect:'vignette',duration:0,enabled:true,categoryId:categories[0]?.id||'opening',modes:Object.fromEntries(MODE_KEYS.map(k=>[k,true]))});
 p.querySelectorAll('[data-id]').forEach(row=>{const s=slides.find(x=>x.id===row.dataset.id);row.querySelector('.edit').onclick=()=>openSlide(s);row.querySelector('.duplicate').onclick=()=>openSlide({...structuredClone(s),id:uid('slide'),title:`${s.title} Copy`,order:(slides.at(-1)?.order||0)+1});row.querySelector('.remove').onclick=async()=>{if(confirm(`Remove “${s.title}”?`))await ctx.backend.deleteDoc(ctx.eventId,'slides',s.id)}});
 function openSlide(s){
  const positions=[
   ['left top','&#8598;'],['center top','&#8593;'],['right top','&#8599;'],
   ['left center','&#8592;'],['center center','&#8226;'],['right center','&#8594;'],
   ['left bottom','&#8601;'],['center bottom','&#8595;'],['right bottom','&#8600;']
  ];
  const transitions=[['fade','Fade'],['zoom','Zoom'],['left','Slide from left'],['right','Slide from right'],['up','Rise'],['blur','Focus'],['wipe','Wipe']];
  const effects=[['vignette','Vignette'],['goldSweep','Gold sweep'],['lightSweep','Light sweep'],['focusPulse','Focus pulse']];
  const motions=[['a','Slow push'],['b','Horizontal drift'],['c','Vertical drift'],['d','Slow pull']];
  const options=(items,current)=>items.map(([v,l])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(l)}</option>`).join('');
  const currentPosition=s.position||'center center';

  const m=modal(s.title||'Slide',`<div class="slide-editor">
   <aside class="slide-preview-pane">
    <div class="slide-preview-label"><span>Audience preview</span><span id="previewStatus">${s.enabled===false?'Excluded':'Included'}</span></div>
    <div class="slide-live-preview ${esc(s.align||'left')}" id="slideLivePreview">
     <div class="slide-preview-media" id="slidePreviewMedia"></div>
     <video id="slidePreviewVideo" muted playsinline loop></video>
     <div class="slide-preview-shade"></div>
     <div class="slide-preview-copy">
      <div class="slide-preview-eyebrow" id="previewEyebrow"></div>
      <h3 id="previewTitle"></h3>
      <div class="slide-preview-rule"></div>
      <p id="previewSub"></p>
     </div>
    </div>
    <p class="slide-preview-hint">Preview approximates the Audience Display. Final cropping follows the display device's aspect ratio.</p>
   </aside>

   <div class="slide-edit-sections">
    <details class="slide-edit-section" open>
     <summary><span><b>Content</b><small>What the audience reads</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      ${input('Title',s.title,'text','id="title" maxlength="160"')}
      ${input('Eyebrow',s.eyebrow,'text','id="eyebrow" maxlength="100"')}
      <div class="field span2"><label for="sub">Subtitle</label><textarea id="sub" maxlength="600">${esc(s.sub||'')}</textarea></div>
     </div>
    </details>

    <details class="slide-edit-section" open>
     <summary><span><b>Media</b><small>Background image or video and focal point</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body">
      <div class="form-grid">
       <div class="field"><label for="mediaType">Media type</label><select id="mediaType"><option value="image" ${s.mediaType!=='video'?'selected':''}>Image</option><option value="video" ${s.mediaType==='video'?'selected':''}>Video background</option></select></div>
       ${input('Image / video URL',s.mediaUrl,'url','id="mediaUrl" inputmode="url"')}
       ${input('Credit URL',s.creditUrl,'url','id="creditUrl" inputmode="url"')}
      </div>
      <div class="field media-position-field"><label>Focal point</label><input id="position" type="hidden" value="${esc(currentPosition)}">
       <div class="media-position-grid" id="positionGrid">${positions.map(([v,symbol])=>`<button type="button" class="media-position-btn ${currentPosition===v?'active':''}" data-position="${v}" aria-label="${v}" aria-pressed="${String(currentPosition===v)}">${symbol}</button>`).join('')}</div>
      </div>
      <details class="fine-position"><summary>Advanced media position</summary>${input('CSS object position',currentPosition,'text','id="positionAdvanced" placeholder="center 40%"')}</details>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Timing</b><small>Sequence, duration, and transition</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      ${input('Slide order',s.order,'number','id="order" min="1" max="999"')}
      ${input('Duration override',s.duration,'number','id="duration" min="0" max="300" step="1"')}
      <div class="field span2"><label for="transition">Transition</label><select id="transition">${options(transitions,s.transition||'fade')}</select><small class="field-help">Use 0 seconds for the event default duration.</small></div>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Appearance</b><small>Text placement and cinematic treatment</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      <div class="field"><label for="align">Text alignment</label><select id="align">${options([['left','Left'],['center','Center'],['right','Right']],s.align||'left')}</select></div>
      <div class="field"><label for="effect">Cinematic effect</label><select id="effect">${options(effects,s.effect||'vignette')}</select></div>
      <div class="field span2"><label for="motion">Photo motion</label><select id="motion">${options(motions,s.motion||'a')}</select><small class="field-help">Motion affects still images only.</small></div>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Availability</b><small>Where this slide appears</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body">
      <div class="form-grid">
       <div class="field"><label for="category">Category</label><select id="category">${catOpts.map(([v,l])=>`<option value="${esc(v)}" ${v===s.categoryId?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
       <div class="field slide-enabled-field"><label>Deck status</label><label class="check availability-toggle"><input id="enabled" type="checkbox" ${s.enabled!==false?'checked':''}> Included in deck</label></div>
      </div>
      <div class="field"><label>Ceremony modes</label><div class="mode-checks">${MODE_KEYS.map(k=>`<label><input type="checkbox" data-mode="${k}" ${s.modes?.[k]!==false?'checked':''}> ${k}</label>`).join('')}</div></div>
     </div>
    </details>
   </div>
  </div>
  <div class="slide-editor-actions"><button class="btn" data-cancel>Cancel</button><button class="btn primary" data-save>Save slide</button></div>`);
  m.querySelector('.modal-card')?.classList.add('slide-editor-modal');
  closeOnCancel(m);

  const q=sel=>m.querySelector(sel);
  const preview=q('#slideLivePreview'),previewMedia=q('#slidePreviewMedia'),previewVideo=q('#slidePreviewVideo');

  function syncPosition(value){
   q('#position').value=value;
   q('#positionAdvanced').value=value;
   q('#positionGrid').querySelectorAll('[data-position]').forEach(b=>{
    const active=b.dataset.position===value;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',String(active));
   });
  }
  function updatePreview(){
   const type=q('#mediaType').value;
   const url=q('#mediaUrl').value.trim();
   const position=q('#position').value||'center center';
   q('#previewTitle').textContent=q('#title').value.trim()||'Slide title';
   q('#previewEyebrow').textContent=q('#eyebrow').value.trim();
   q('#previewSub').textContent=q('#sub').value.trim();
   q('#previewStatus').textContent=q('#enabled').checked?'Included':'Excluded';
   preview.className='slide-live-preview '+q('#align').value;
   previewMedia.style.backgroundPosition=position;
   previewVideo.style.objectPosition=position;
   if(type==='video'&&url){
    previewMedia.style.backgroundImage='';
    previewMedia.hidden=true;
    previewVideo.hidden=false;
    if(previewVideo.src!==url){previewVideo.src=url;previewVideo.play().catch(()=>{})}
   }else{
    previewVideo.pause();
    previewVideo.removeAttribute('src');
    previewVideo.load();
    previewVideo.hidden=true;
    previewMedia.hidden=false;
    previewMedia.style.backgroundImage=url?`url("${url.replaceAll('"','%22')}")`:'';
   }
  }

  q('#positionGrid').onclick=e=>{
   const b=e.target.closest('[data-position]');if(!b)return;
   syncPosition(b.dataset.position);updatePreview();
  };
  q('#positionAdvanced').oninput=e=>{syncPosition(e.target.value);updatePreview()};
  ['#title','#eyebrow','#sub','#mediaUrl'].forEach(sel=>q(sel).addEventListener('input',updatePreview));
  ['#mediaType','#align','#enabled'].forEach(sel=>q(sel).addEventListener('change',updatePreview));
  updatePreview();

  m.querySelector('[data-save]').onclick=async()=>{
   const modes=Object.fromEntries([...m.querySelectorAll('[data-mode]')].map(x=>[x.dataset.mode,x.checked]));
   await ctx.backend.putDoc(ctx.eventId,'slides',s.id,{
    title:q('#title').value.trim().slice(0,160),
    eyebrow:q('#eyebrow').value.trim().slice(0,100),
    sub:q('#sub').value.trim().slice(0,600),
    mediaType:q('#mediaType').value,
    mediaUrl:q('#mediaUrl').value.trim().slice(0,2048),
    creditUrl:q('#creditUrl').value.trim().slice(0,2048),
    order:clamp(num(q('#order').value,1),1,999),
    duration:clamp(num(q('#duration').value,0),0,300),
    categoryId:q('#category').value,
    align:q('#align').value,
    position:q('#position').value.trim().slice(0,80),
    transition:q('#transition').value,
    motion:q('#motion').value,
    effect:q('#effect').value,
    enabled:q('#enabled').checked,
    modes
   });
   previewVideo.pause();
   m.remove();
   toast('Slide saved');
  };
 }
}