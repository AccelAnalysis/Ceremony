import {input,modal,closeOnCancel,num,clamp,esc,toast} from './editor-helpers.js';
import {uid} from './utils.js';
import {MODE_KEYS} from './seed-data.js';

const POSITIONS=[
 ['left top','&#8598;'],['center top','&#8593;'],['right top','&#8599;'],
 ['left center','&#8592;'],['center center','&#8226;'],['right center','&#8594;'],
 ['left bottom','&#8601;'],['center bottom','&#8595;'],['right bottom','&#8600;']
];
const TRANSITIONS=[['fade','Fade'],['zoom','Zoom'],['left','Slide from left'],['right','Slide from right'],['up','Rise'],['blur','Focus'],['wipe','Wipe']];
const EFFECTS=[['vignette','Vignette'],['goldSweep','Gold sweep'],['lightSweep','Light sweep'],['focusPulse','Focus pulse']];
const MOTIONS=[['a','Slow push'],['b','Horizontal drift'],['c','Vertical drift'],['d','Slow pull']];

function selectOptions(options,current){return options.map(([v,l])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(l)}</option>`).join('')}
function mediaThumb(s){
 if(s.mediaType==='image'&&s.mediaUrl)return `<div class="slide-list-thumb" style="background-image:url('${esc(s.mediaUrl).replaceAll("'","%27")}')"></div>`;
 return `<div class="slide-list-thumb slide-list-thumb-${esc(s.mediaType||'image')}"><span>${s.mediaType==='video'?'&#9654;':'&#9639;'}</span></div>`;
}

export function renderSlidesPanel(p,ctx){
 const {slides,categories}=ctx.state;
 const catOpts=categories.map(c=>[c.id,c.name]);
 p.innerHTML=`<div class="panel-head"><div><h2 class="section-title">Slides &middot; ${slides.length}</h2><p class="section-sub">Build the audience experience with content, media, timing, appearance, and ceremony availability.</p></div><div class="toolbar"><button class="btn" id="includeAll">Include all slides</button><button class="btn primary" id="addSlide">Add slide</button></div></div>
 <div class="item-list slide-list">${slides.map(s=>`<article class="item-card slide-list-card ${s.enabled===false?'excluded':''}" data-id="${esc(s.id)}">
  <div class="slide-list-main">${mediaThumb(s)}<div class="slide-list-copy"><b>${String(s.order).padStart(2,'0')} &middot; ${esc(s.title)}</b><div class="meta">${esc(categories.find(c=>c.id===s.categoryId)?.name||s.categoryId||'Uncategorized')} &middot; ${s.enabled===false?'Excluded':'Included'}</div></div></div>
  <div class="toolbar slide-list-actions"><button class="btn edit">Edit</button><button class="btn duplicate">Duplicate</button><button class="btn danger remove">Remove</button></div>
 </article>`).join('')}</div>`;

 p.querySelector('#includeAll').onclick=async()=>{
  const excluded=slides.filter(s=>s.enabled===false);
  for(const s of excluded){const {id,...data}=s;await ctx.backend.putDoc(ctx.eventId,'slides',id,{...data,enabled:true})}
  toast(excluded.length?'All slides included':'All slides were already included');
 };
 p.querySelector('#addSlide').onclick=()=>openSlide({
  id:uid('slide'),order:(slides.at(-1)?.order||0)+1,title:'New Slide',eyebrow:'AK9I',sub:'',
  mediaType:'image',mediaUrl:'',creditUrl:'',align:'left',position:'center center',
  transition:'fade',motion:'a',effect:'vignette',duration:0,enabled:true,
  categoryId:categories[0]?.id||'opening',modes:Object.fromEntries(MODE_KEYS.map(k=>[k,true]))
 });
 p.querySelectorAll('[data-id]').forEach(row=>{
  const s=slides.find(x=>x.id===row.dataset.id);
  row.querySelector('.edit').onclick=()=>openSlide(s);
  row.querySelector('.duplicate').onclick=()=>openSlide({...structuredClone(s),id:uid('slide'),title:`${s.title} Copy`,order:(slides.at(-1)?.order||0)+1});
  row.querySelector('.remove').onclick=async()=>{if(confirm(`Remove "${s.title}"?`))await ctx.backend.deleteDoc(ctx.eventId,'slides',s.id)};
 });

 function openSlide(s){
  const currentPosition=s.position||'center center';
  const m=modal(s.title||'Slide',`<div class="slide-editor">
   <aside class="slide-preview-pane">
    <div class="slide-preview-label"><span>Audience preview</span><span id="previewStatus">${s.enabled===false?'Excluded':'Included'}</span></div>
    <div class="slide-live-preview ${esc(s.align||'left')}" id="slideLivePreview">
     <div class="slide-preview-media" id="slidePreviewMedia"></div>
     <video id="slidePreviewVideo" muted playsinline loop></video>
     <div class="slide-preview-shade"></div>
     <div class="slide-preview-copy">
      <div class="slide-previewYeyebrow" id="previewEyebrow"></div>
      <h3 id="previewTitle"></h3>
      <div class="slide-previewRule"></div>
      <p id="previewSub"></p>
     </div>
    </div>
    <p class="slide-preview-hint">Preview approximates the Audience Display. Final cropping follows the display device's aspect ratio.</p>
   </aside>

   <div class="slide-edit-sections">
    <details class="slide-edit-section" open>
     <summary><span><b>Content</b><small>What the audience reads</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      ${input('Title',s.title+'text','id="title" maxlength="160"')}
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
       <div class="media-position-grid" id="positionGrid">${POSITIONS.map(([v,symbol])=>`<button type="button" class="media-position-btn ${currentPosition===v?'active':''}" data-position="${v}" aria-label="${v}" aria-pressed="${String(currentPosition===v)}">${symbol}</button>`).join('')}</div>
      </div>
      <details class="fine-position"><summary>Advanced media position</summary>${input('CSS object position',currentPosition,'text','id="positionAdvanced" placeholder="center 40%"')}</details>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Timing</b><small>Sequence, duration, and transition</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      ${input('Slide order',s.order,'number','id="order" min="1" max="999"')}
      ${input('Duration override',s.duration,'number','id="duration" min="0" max="300" step="1"')}
      <div class="field span2"><label for="transition">Transition</label><select id="transition">${selectOptions(TRANSITIONS,s.transition||'fade')}</select><small class="field-help">Use 0 seconds for the event's default duration.</small></div>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Appearance</b><small>Text placement and cinematic treatment</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body form-grid">
      <div class="field"><label for="align">Text alignment</label><select id="align">${selectOptions([['left','Left'],['center','Center'],['right','Right']],s.align||'left')}</select></div>
      <div class="field"><label for="effect">Cinematic effect</label><select id="effect">${selectOptions(EFFECTS,s.effect||'vignette')}</select></div>
      <div class="field span2"><label for="motion">Photo motion</label><select id="motion">${selectOptions(MOTIONS,s.motion||'a')}</select><small class="field-help">Motion affects still images only.</small></div>
     </div>
    </details>

    <details class="slide-edit-section">
     <summary><span><b>Availability</b><small>Where this slide appears</small></span><span class="disclosure">&#8250;</span></summary>
     <div class="slide-section-body">
      <div class="form-grid">
       <div class="field"><label for="category">Category</label><select id="category">${catOpts.map(([v,l])=>`<option value="${esc(v)}" ${v==ÿÿÿ¹Ñ½Éå%üÍ±ÑèôøíÍ¡°¥ôð½½ÁÑ¥½¸ù¤¹©½¥¸ ¥ôð½Í±Ðøð½¥Øø(ñ¥Ø±ÍÌô¥±Í±¥µ¹±µ¥±øñ±°ù¬ÍÑÑÕÌð½±°øñ±°±ÍÌô¡¬Ù¥±¥±¥ÑäµÑ½±øñ¥¹ÁÕÐ¥ô¹±ÑåÁô¡­½àíÌ¹¹±ôõ±Íü¡­èôø%¹±Õ¥¸¬ð½±°øð½¥Øø(ð½¥Øø(ñ¥Ø±ÍÌô¥±øñ±°ùÉµ½¹äµ½Ìð½±°øñ¥Ø±ÍÌôµ½µ¡­Ìøí5=}-eL¹µÀ¡¬ôùñ±°øñ¥¹ÁÕÐÑåÁô¡­½àÑµµ½ôí­ôíÌ¹µ½Ìü¹m­tôõ±Íü¡­èôøí­ôð½±°ù¤¹©½¥¸ ¥ôð½¥Øøð½¥Øø(ð½¥Øø(ð½Ñ¥±Ìø(ð½¥Øø(ð½¥Øø(ñ¥Ø±ÍÌôÍ±¥µ¥Ñ½ÈµÑ¥½¹ÌøñÕÑÑ½¸±ÍÌôÑ¸Ñµ¹°ù¹°ð½ÕÑÑ½¸øñÕÑÑ½¸±ÍÌôÑ¸ÁÉ¥µÉäÑµÍÙùMÙÍ±¥ð½ÕÑÑ½¸øð½¥Øù¤ì(±½Í=¹¹°¡´¤ì((½¹ÍÐÄõ¥ôù´¹ÅÕÉåM±Ñ½È¡¥¤ì(½¹ÍÐÁÉÙ¥ÜõÄ Í±¥1¥ÙAÉÙ¥Ü¤±ÁÉÙ¥Ý5¥õÄ Í±¥AÉÙ¥Ý5¥¤±ÁÉÙ¥ÝY¥¼õÄ Í±¥AÉÙ¥ÝY¥¼¤ì(Õ¹Ñ¥½¸Íå¹A½Í¥Ñ¥½¹	ÕÑÑ½¹Ì¡Ù±Õ¥ì(Ä Á½Í¥Ñ¥½¸¤¹Ù±ÕõÙ±Õì(Ä Á½Í¥Ñ¥½¹Ù¹¤¹Ù±ÕõÙ±Õì(Ä Á½Í¥Ñ¥½¹É¥¤¹ÅÕÉåM±Ñ½É±° mÑµÁ½Í¥Ñ¥½¹t¤¹½É ¡ôùí½¹ÍÐÑ¥Ùõ¹ÑÍÐ¹Á½Í¥Ñ¥½¸ôôõÙ±Õí¹±ÍÍ1¥ÍÐ¹Ñ½± Ñ¥Ù±Ñ¥Ù¤í¹ÍÑÑÑÉ¥ÕÑ É¥µÁÉÍÍ±MÑÉ¥¹¡Ñ¥Ù¤¥ô¤ì(ô(Õ¹Ñ¥½¸ÕÁÑAÉÙ¥Ü ¥ì(½¹ÍÐÑåÁõÄ µ¥QåÁ¤¹Ù±Õ±ÕÉ°õÄ µ¥UÉ°¤¹Ù±Õ¹ÑÉ¥´ ¤±Á½Í¥Ñ¥½¸õÄ Á½Í¥Ñ¥½¸¤¹Ù±Õñð¹ÑÈ¹ÑÈì(Ä ÁÉÙ¥ÝQ¥Ñ±¤¹ÑáÑ½¹Ñ¹ÐõÄ Ñ¥Ñ±¤¹Ù±Õ¹ÑÉ¥´ ¥ñðM±¥Ñ¥Ñ±ì(Ä ÁÉÙ¥ÝåÉ½Ü¤¹ÑáÑ½¹Ñ¹ÐõÄ åÉ½Ü¤¹Ù±Õ¹ÑÉ¥´ ¤ì(Ä ÁÉÙ¥ÝMÕ¤¹ÑáÑ½¹Ñ¹ÐõÄ ÍÕ¤¹Ù±Õ¹ÑÉ¥´ ¤ì(ÁÉÙ¥Ü¹±ÍÍ9µôÍ±¥µ±¥ÙµÁÉÙ¥Ü­Ä ±¥¸¤¹Ù±Õì(Ä ÁÉÙ¥ÝMÑÑÕÌ¤¹ÑáÑ½¹Ñ¹ÐõÄ ¹±¤¹¡­ü%¹±Õèá±Õì(ÁÉÙ¥Ý5¥¹ÍÑå±¹­É½Õ¹A½Í¥Ñ¥½¸õÁ½Í¥Ñ¥½¸ì(ÁÉÙ¥ÝY¥¼¹ÍÑå±¹½©ÑA½Í¥Ñ¥½¸õÁ½Í¥Ñ¥½¸ì(¥¡ÑåÁôôôÙ¥¼ÕÉ°¥ì(ÁÉÙ¥Ý5¥¹ÍÑå±¹­É½Õ¹%µôì(ÁÉÙ¥Ý5¥¹¡¥¸õÑÉÕíÁÉÙ¥ÝY¥¼¹¡¥¸õ±Íì(¥¡ÁÉÙ¥ÝY¥¼¹ÍÉôõÕÉ°¥íÁÉÙ¥ÝY¥¼¹ÍÉõÕÉ°íÁÉÙ¥ÝY¥¼¹Á±ä ¤¹Ñ   ¤ôùíô¥ô(õ±Íì(ÁÉÙ¥ÝY¥¼¹ÁÕÍ ¤íÁÉÙ¥ÝY¥¼¹Éµ½ÙÑÑÉ¥ÕÑ ÍÉ¤íÁÉÙ¥ÝY¥¼¹±½ ¤íÁÉÙ¥ÝY¥¼¹¡¥¸õÑÉÕíÁÉÙ¥Ý5¥¹¡¥¸õ±Íì(ÁÉÙ¥Ý5¥¹ÍÑå±¹­É½Õ¹%µõÕÉ°ýÕÉ° íÕÉ°¹ÉÁ±±° °ÈÈ¥ô¥èì(ô(ô(Ä Á½Í¥Ñ¥½¹É¥¤¹½¹±¥¬õôùí½¹ÍÐõ¹ÑÉÐ¹±½ÍÍÐ mÑµÁ½Í¥Ñ¥½¹t¤í¥ ¥ÉÑÕÉ¸íÍå¹A½Í¥Ñ¥½¹	ÕÑÑ½¹Ì¡¹ÑÍÐ¹Á½Í¥Ñ¥½¸¤íÕÁÑAÉÙ¥Ü ¥ôì(Ä Á½Í¥Ñ¥½¹Ù¹¤¹½¹¥¹ÁÕÐõôùíÄ Á½Í¥Ñ¥½¸¤¹Ù±Õõ¹ÑÉÐ¹Ù±ÕíÍå¹A½Í¥Ñ¥½¹	ÕÑÑ½¹Ì¡¹ÑÉÐ¹Ù±Õ¤íÕÁÑAÉÙ¥Ü ¥ôì(lÑ¥Ñ±°åÉ½Ü°ÍÕ°µ¥UÉ°t¹½É ¡Í°ôùÄ¡Í°¤¹Ù¹Ñ1¥ÍÑ¹È ¥¹ÁÕÐ±ÕÁÑAÉÙ¥Ü¤¤ì(lµ¥QåÁ°±¥¸°¹±t¹½É ¡Í°ôùÄ¡Í°¤¹Ù¹Ñ1¥ÍÑ¹È ¡¹±ÕÁÑAÉÙ¥Ü¤¤ì(ÕÁÑAÉÙ¥Ü ¤ì((´¹ÅÕÉåM±Ñ½È mÑµÍÙt¤¹½¹±¥¬õÍå¹ ¤ôùì(½¹ÍÐµ½Ìõ=©Ð¹É½µ¹ÑÉ¥Ì¡l¸¸¹´¹ÅÕÉåM±Ñ½É±° mÑµµ½t¥t¹µÀ¡àôùmà¹ÑÍÐ¹µ½±à¹¡­t¤¤ì(Ý¥ÐÑà¹­¹¹ÁÕÑ½¡Ñà¹Ù¹Ñ%°Í±¥Ì±Ì¹¥±ì(Ñ¥Ñ±éÄ Ñ¥Ñ±¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°ÄØÀ¤°(åÉ½ÜéÄ åÉ½Ü¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°ÄÀÀ¤°(ÍÕéÄ ÍÕ¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°ØÀÀ¤°(µ¥QåÁéÄ µ¥QåÁ¤¹Ù±Õ°(µ¥UÉ°éÄ µ¥UÉ°¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°ÈÀÐà¤°(É¥ÑUÉ°éÄ É¥ÑUÉ°¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°ÈÀÐà¤°(½ÉÈé±µÀ¡¹Õ´¡Ä ½ÉÈ¤¹Ù±Õ°Ä¤°Ä°äää¤°(ÕÉÑ¥½¸é±µÀ¡¹Õ´¡Ä ÕÉÑ¥½¸¤¹Ù±Õ°À¤°À°ÌÀÀ¤°(Ñ½Éå%éÄ Ñ½Éä¤¹Ù±Õ°(±¥¸éÄ ±¥¸¤¹Ù±Õ°(Á½Í¥Ñ¥½¸éÄ Á½Í¥Ñ¥½¸¤¹Ù±Õ¹ÑÉ¥´ ¤¹Í±¥ À°àÀ¤°(ÑÉ¹Í¥Ñ¥½¸éÄ ÑÉ¹Í¥Ñ¥½¸¤¹Ù±Õ°(µ½Ñ¥½¸éÄ µ½Ñ¥½¸¤¹Ù±Õ°(ÐéÄ Ð¤¹Ù±Õ°(¹±éÄ ¹±¤¹¡­°(µ½Ì(ô¤ì(ÁÉÙ¥ÝY¥¼¹ÁÕÍ ¤í´¹Éµ½Ù ¤íÑ½ÍÐ M±¥ÍÙ¤ì(ôì(ô)ô(