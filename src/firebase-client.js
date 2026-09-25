import {getFirebaseConfig,isFirebaseConfigured} from './config-store.js';
let ctxPromise=null;
export async function getFirebase(){
 if(ctxPromise)return ctxPromise;
 ctxPromise=(async()=>{
  const config=getFirebaseConfig();
  if(!isFirebaseConfigured(config)) throw new Error('Firebase web app is not configured yet. Register the Ceremony web app and provide apiKey + appId.');
  const [{initializeApp},{getAuth,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged},{getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,onSnapshot,query,orderBy,writeBatch,runTransaction,serverTimestamp,Timestamp,increment}] = await Promise.all([
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
  ]);
  const app=initializeApp(config); const auth=getAuth(app); await setPersistence(auth,browserLocalPersistence); const db=getFirestore(app);
  return {app,auth,db,api:{signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,onSnapshot,query,orderBy,writeBatch,runTransaction,serverTimestamp,Timestamp,increment}};
 })();
 return ctxPromise;
}
