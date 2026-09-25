import {getFirebase} from './firebase-client.js';
import {localBackend,localAuth} from './local-backend.js';
export const demoMode=new URLSearchParams(location.search).get('demo')==='1';

let backendPromise=null;
export async function getBackend(){
 if(demoMode)return {backend:localBackend,auth:localAuth,mode:'demo'};
 if(backendPromise)return backendPromise;
 backendPromise=(async()=>{
  const f=await getFirebase(); const {db,auth,api}=f;
  const path=(eventId,...parts)=>api.doc(db,'events',eventId,...parts);
  const col=(eventId,name)=>api.collection(db,'events',eventId,name);
  const asDate=v=>v?.toDate?v.toDate():v?new Date(v):null;
  const normalize=(d)=>{if(!d)return d;const o={...d};for(const k of ['createdAt','updatedAt','ceremonyStartAt','runAt','executedAt','slideStartedAt'])if(o[k])o[k]=asDate(o[k]);return o};
  const backend={
   async getEvent(id){const s=await api.getDoc(path(id));return s.exists()?{id:s.id,...normalize(s.data())}:null},
   subscribeEvent(id,cb){return api.onSnapshot(path(id),s=>cb(s.exists()?{id:s.id,...normalize(s.data())}:null))},
   subscribeCollection(id,name,cb){const q=api.query(col(id,name),api.orderBy('order'));return api.onSnapshot(q,s=>cb(s.docs.map(d=>({id:d.id,...normalize(d.data())}))))},
   subscribeRuntime(id,cb){return api.onSnapshot(path(id,'runtime','state'),s=>cb(s.exists()?normalize(s.data()):null))},
   async seedEvent(id,payload){
    const batch=api.writeBatch(db); const now=api.serverTimestamp();
    const meta={...payload.meta,createdAt:now,updatedAt:now,ownerUid:auth.currentUser.uid,ceremonyStartAt:payload.meta.ceremonyStartAt?api.Timestamp.fromDate(new Date(payload.meta.ceremonyStartAt)):null};
    batch.set(path(id),meta);
    for(const name of ['slides','categories','graduates','awards','tracks','schedule']){
     for(const d of payload[name]||[]){const {id:docId,...data}=d;const copy={...data};if(copy.runAt instanceof Date)copy.runAt=api.Timestamp.fromDate(copy.runAt);batch.set(path(id,name,docId),copy)}
    }
    batch.set(path(id,'runtime','state'),{...payload.runtime,slideStartedAt:now,updatedAt:now,updatedBy:auth.currentUser.uid});
    await batch.commit();
   },
   async putDoc(id,name,docId,data){const copy={...data};if(copy.runAt instanceof Date)copy.runAt=api.Timestamp.fromDate(copy.runAt);await api.setDoc(path(id,name,docId),copy,{merge:false})},
   async updateEvent(id,patch){const copy={...patch,updatedAt:api.serverTimestamp()};if('ceremonyStartAt'in copy)copy.ceremonyStartAt=copy.ceremonyStartAt?api.Timestamp.fromDate(new Date(copy.ceremonyStartAt)):null;await api.updateDoc(path(id),copy)},
   async deleteDoc(id,name,docId){await api.deleteDoc(path(id,name,docId))},
   async mutateRuntime(id,mutator){let result=null;await api.runTransaction(db,async tx=>{const ref=path(id,'runtime','state');const snap=await tx.get(ref);const cur=snap.exists()?normalize(snap.data()):{};const next=mutator(structuredClone(cur));next.stateVersion=(cur.stateVersion||0)+1;next.updatedAt=api.serverTimestamp();next.updatedBy=auth.currentUser.uid;if(next.currentSlideId!==cur.currentSlideId||(!cur.playing&&next.playing))next.slideStartedAt=api.serverTimestamp();tx.set(ref,next,{merge:false});result=next});return result},
   async claimSchedule(id,executionId,mutator){let claimed=false;await api.runTransaction(db,async tx=>{const er=path(id,'scheduleExecutions',executionId),rr=path(id,'runtime','state');const [es,rs]=await Promise.all([tx.get(er),tx.get(rr)]);if(es.exists())return;const cur=rs.exists()?normalize(rs.data()):{};const next=mutator(structuredClone(cur));next.stateVersion=(cur.stateVersion||0)+1;next.updatedAt=api.serverTimestamp();next.updatedBy=auth.currentUser.uid;if(next.currentSlideId!==cur.currentSlideId||(!cur.playing&&next.playing))next.slideStartedAt=api.serverTimestamp();tx.set(er,{executedAt:api.serverTimestamp(),actorUid:auth.currentUser.uid},{merge:false});tx.set(rr,next,{merge:false});claimed=true});return claimed}
  };
  const authApi={
   get currentUser(){return auth.currentUser},
   signIn:(email,password)=>api.signInWithEmailAndPassword(auth,email,password),
   signUp:(email,password)=>api.createUserWithEmailAndPassword(auth,email,password),
   signOut:()=>api.signOut(auth),
   onChange:(cb)=>api.onAuthStateChanged(auth,cb)
  };
  return {backend,auth:authApi,mode:'firebase'};
 })();
 return backendPromise;
}
