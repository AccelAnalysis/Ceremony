const KEY='ceremony.demo.db.v1'; const listeners=new Set();
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(db){localStorage.setItem(KEY,JSON.stringify(db));listeners.forEach(fn=>fn())}
function ensureEvent(db,id){db.events??={};db.events[id]??={meta:null,slides:{},categories:{},graduates:{},awards:{},tracks:{},schedule:{},runtime:null,executions:{},members:{}};return db.events[id]}
export const localAuth={currentUser:{uid:'demo-user',email:'demo@ceremony.local'},async signIn(){return this.currentUser},async signUp(){return this.currentUser},async signOut(){},onChange(cb){cb(this.currentUser);return()=>{}}};
export const localBackend={
 async getEvent(id){return load().events?.[id]?.meta||null},
 subscribeEvent(id,cb){const fire=()=>cb(load().events?.[id]?.meta||null);listeners.add(fire);fire();return()=>listeners.delete(fire)},
 subscribeCollection(id,name,cb){const fire=()=>{const o=load().events?.[id]?.[name]||{};cb(Object.entries(o).map(([id,data])=>({id,...data})).sort((a,b)=>(a.order??0)-(b.order??0)))};listeners.add(fire);fire();return()=>listeners.delete(fire)},
 subscribeRuntime(id,cb){const fire=()=>cb(load().events?.[id]?.runtime||null);listeners.add(fire);fire();return()=>listeners.delete(fire)},
 async seedEvent(id,payload){const db=load(),e=ensureEvent(db,id);e.meta=payload.meta;e.runtime={...payload.runtime,slideStartedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:'demo-user'};for(const n of ['slides','categories','graduates','awards','tracks','schedule']){e[n]={};for(const d of payload[n]||[])e[n][d.id]={...d,id:undefined}}save(db)},
 async putDoc(id,name,docId,data){const db=load(),e=ensureEvent(db,id);e[name]??={};e[name][docId]={...data};save(db)},
 async updateEvent(id,patch){const db=load(),e=ensureEvent(db,id);e.meta={...(e.meta||{}),...patch,updatedAt:new Date().toISOString()};save(db)},
 async deleteDoc(id,name,docId){const db=load(),e=ensureEvent(db,id);delete e[name]?.[docId];save(db)},
 async mutateRuntime(id,mutator){const db=load(),e=ensureEvent(db,id);const cur=e.runtime||{};const next=mutator(structuredClone(cur));next.stateVersion=(cur.stateVersion||0)+1;next.updatedAt=new Date().toISOString();next.updatedBy='demo-user';if(next.currentSlideId!==cur.currentSlideId||(!cur.playing&&next.playing))next.slideStartedAt=new Date().toISOString();e.runtime=next;save(db);return next},
 async claimSchedule(id,executionId,mutator){const db=load(),e=ensureEvent(db,id);if(e.executions[executionId])return false;e.executions[executionId]={executedAt:new Date().toISOString(),actorUid:'demo-user'};const cur=e.runtime||{};const next=mutator(structuredClone(cur));next.stateVersion=(cur.stateVersion||0)+1;next.updatedAt=new Date().toISOString();next.updatedBy='demo-user';if(next.currentSlideId!==cur.currentSlideId||(!cur.playing&&next.playing))next.slideStartedAt=new Date().toISOString();e.runtime=next;save(db);return true}
};
