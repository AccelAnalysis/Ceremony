import fs from 'node:fs';
const root=new URL('../',import.meta.url);

const must=[
  'index.html','display/index.html','control/index.html','editor/index.html',
  'src/display.js','src/display-stage.js','src/display-hud.js','src/audio-engine.js',
  'src/director.js','src/editor.js','src/editor-records.js','src/editor-slides.js',
  'src/state.js','src/scheduler.js','src/backend.js','src/firebase-client.js',
  'firestore.rules','storage.rules','firebase.json'
];
for(const f of must){
  if(!fs.existsSync(new URL(f,root)))throw new Error(`Missing ${f}`);
}

const seed=fs.readFileSync(new URL('src/seed-data.js',root),'utf8');
const slideCount=(seed.match(/\["s\d{2}",/g)||[]).length;
if(slideCount!==30)throw new Error(`Expected 30 seed slides, found ${slideCount}`);

const stage=fs.readFileSync(new URL('src/display-stage.js',root),'utf8');
if(!stage.includes('clearTimeout(transitionTimer)'))throw new Error('Transition cancellation missing');
if(!stage.includes("v.autoplay=false")||!stage.includes("oldVideo.pause()"))throw new Error('Inactive video lifecycle control missing');
for(const transition of ['zoom','left','right','up','blur','wipe']){
  if(!stage.includes(`enter-${transition}`))throw new Error(`Transition ${transition} missing`);
}

const display=fs.readFileSync(new URL('src/display.js',root),'utf8');
if(display.includes('claimSchedule('))throw new Error('Audience Display must not execute the authoritative schedule');
if(!display.includes('cinema-off'))throw new Error('Live cinematic visibility missing');
if(!display.includes('keepAwakeBtn'))throw new Error('Audience wake-lock control missing');
if(!display.includes('display-chrome-visible')||!display.includes('cursor-hidden'))throw new Error('Audience operator chrome auto-hide missing');

const displayCss=fs.readFileSync(new URL('styles/display.css',root),'utf8');
if(!displayCss.includes('.display-setup')||!displayCss.includes('opacity:0'))throw new Error('Audience setup control must be invisible at rest');
if(!displayCss.includes('prefers-reduced-motion'))throw new Error('Audience reduced-motion support missing');

const displayHud=fs.readFileSync(new URL('src/display-hud.js',root),'utf8');
if(!displayHud.includes('var(--safe-left)')||!displayHud.includes('var(--safe-bottom)'))throw new Error('Audience HUD safe-area positioning missing');

const director=fs.readFileSync(new URL('src/director.js',root),'utf8');
if(!director.includes('auto_')||!director.includes('scheduleAutoAdvance'))throw new Error('Director auto-advance authority missing');
for(const id of ['overlayToggle','captionsToggle','brandToggle','motionToggle','progressToggle','cinemaToggle','prevTrack','nextTrack','excludeCurrent']){
  if(!director.includes(id))throw new Error(`Director control ${id} missing`);
}

const editorRecords=fs.readFileSync(new URL('src/editor-records.js',root),'utf8');
if(!editorRecords.includes('audioFiles')||!editorRecords.includes('uploadAudio'))throw new Error('Audio upload UI missing');
const backend=fs.readFileSync(new URL('src/backend.js',root),'utf8');
if(!backend.includes('uploadAudio')||!backend.includes('uploadBytesResumable'))throw new Error('Firebase Storage audio upload backend missing');
const visual=fs.readFileSync(new URL('src/editor-visual.js',root),'utf8');
if(!visual.includes('cinemaIntensity')||!visual.includes('cinemaEnabled'))throw new Error('Cinematic editor controls missing');

const editorSlides=fs.readFileSync(new URL('src/editor-slides.js',root),'utf8');
for(const token of ['slide-live-preview','slide-edit-section','positionGrid','Content','Media','Timing','Appearance','Availability']){
  if(!editorSlides.includes(token))throw new Error(`Slide Editor HIG control ${token} missing`);
}

const htmls=['display/index.html','control/index.html','editor/index.html'].map(f=>fs.readFileSync(new URL(f,root),'utf8'));
if(!htmls.every(x=>x.includes('type="module"')))throw new Error('Module bootstrap missing');

const firebase=JSON.parse(fs.readFileSync(new URL('firebase.json',root),'utf8'));
if(firebase.storage?.rules!=='storage.rules')throw new Error('Storage rules are not configured for Firebase deployment');

console.log(JSON.stringify({
  ok:true,
  slideCount,
  experiences:3,
  authoritativeRuntime:true,
  musicUploads:true,
  cinematicControls:true,
  storageRules:true
}));
