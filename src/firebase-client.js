import {getFirebaseConfig,isFirebaseConfigured} from './config-store.js';
let ctxPromise=null;
export async function getFirebase(){
 if(ctxPromise)return ctxPromise;
 ctxPromise=(async()=>{
  const config=getFirebaseConfig();
  if(!isFirebaseConfigured(config)) throw new Error('Firebase web app is not configured yet.');
  const [
   {initializeApp},
   {getAuth,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged},
   {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,onSnapshot,query,orderBy,writeBatch,runTransaction,serverTimestamp,Timestamp,increment},
   {getStorage,ref:storageRef,uploadBytesResumable,getDownloadURL,deleteObject}
  ] = await Promise.all([
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
   import('https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js')
  ]);
  const app=initializeApp(config);
  const auth=getAuth(app);
  await setPersistence(auth,browserLocalPersistence);
  const db=getFirestore(app);
  const storage=getStorage(app);
  return {
   app,auth,db,storage,
   api:{
    signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,
    doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,onSnapshot,query,orderBy,writeBatch,runTransaction,serverTimestamp,Timestamp,increment,
    storageRef,uploadBytesResumable,getDownloadURL,deleteObject
   }
  };
 })();
 return ctxPromise;
}
