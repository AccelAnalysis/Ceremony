import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const must=['index.html','display/index.html','control/index.html','editor/index.html','src/display.js','src/director.js','src/editor.js','src/state.js','src/scheduler.js','src/backend.js','firestore.rules','firebase.json'];
for(const f of must){if(!fs.existsSync(new URL(f,root)))throw new Error(`Missing ${f}`)}
const seed=fs.readFileSync(new URL('src/seed-data.js',root),'utf8');
const slideCount=(seed.match(/\"id\": \"s\d+\"/g)||[]).length;
if(slideCount!==30)throw new Error(`Expected 30 seed slides, found ${slideCount}`);
const display=fs.readFileSync(new URL('src/display.js',root),'utf8');
if(!display.includes('clearTimeout(transitionTimer)'))throw new Error('Transition cancellation missing');
if(display.includes('claimSchedule('))throw new Error('Audience Display must be read-only with respect to runtime scheduling');
const director=fs.readFileSync(new URL('src/director.js',root),'utf8');
if(!director.includes('auto_${version}')||!director.includes('scheduleAutoAdvance'))throw new Error('Director auto-advance authority missing');
const htmls=['display/index.html','control/index.html','editor/index.html'].map(f=>fs.readFileSync(new URL(f,root),'utf8'));
if(!htmls.every(x=>x.includes('type="module"')))throw new Error('Module bootstrap missing');
console.log(JSON.stringify({ok:true,slideCount,experiences:3,authoritativeRuntime:true}));
