import { projectDefaults } from '../config/firebase-config.js';
const KEY='ceremony.firebaseConfig.v1';
export function getFirebaseConfig(){let local={};try{local=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}return {...projectDefaults,...local}}
export function saveFirebaseOverride(partial){localStorage.setItem(KEY,JSON.stringify(partial||{}))}
export function clearFirebaseOverride(){localStorage.removeItem(KEY)}
export function isFirebaseConfigured(c=getFirebaseConfig()){return Boolean(c?.apiKey&&c?.appId&&c?.projectId)}
export const firebaseConfigKey=KEY;
