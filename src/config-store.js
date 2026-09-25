import { projectDefaults } from '../config/firebase-config.js';
const KEY='ceremony.firebaseConfig.v1';
const hasCommittedConfig=Boolean(projectDefaults?.apiKey&&projectDefaults?.appId&&projectDefaults?.projectId);
export function getFirebaseConfig(){
 if(hasCommittedConfig)return {...projectDefaults};
 let local={};try{local=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
 const clean=Object.fromEntries(Object.entries(local).filter(([,v])=>v!==''&&v!=null));
 return {...projectDefaults,...clean};
}
export function saveFirebaseOverride(partial){localStorage.setItem(KEY,JSON.stringify(partial||{}))}
export function clearFirebaseOverride(){localStorage.removeItem(KEY)}
export function isFirebaseConfigured(c=getFirebaseConfig()){return Boolean(c?.apiKey&&c?.appId&&c?.projectId)}
export const firebaseConfigKey=KEY;
