import {getBackend,demoMode} from './backend.js';
import {getFirebaseConfig,isFirebaseConfigured,saveFirebaseOverride} from './config-store.js';
import {esc} from './utils.js';

export async function mountAuthGate({title='Ceremony',subtitle='Sign in to continue',allowSignUp=true}={}){
 const gate=document.createElement('section');gate.className='auth-screen';gate.innerHTML=`<div class="auth-card"><div class="brand-lockup"><strong>CEREMONY</strong><span>Firebase event system</span></div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><div id="authError"></div><div class="stack"><div class="field"><label>Email</label><input id="authEmail" type="email" autocomplete="username"></div><div class="field"><label>Password</label><input id="authPassword" type="password" autocomplete="current-password"></div></div><div class="auth-actions"><button class="btn primary" id="signInBtn">Sign in</button>${allowSignUp?'<button class="btn" id="signUpBtn">Create account</button>':''}</div><div class="divider"></div><button class="btn" id="firebaseSetupBtn">Firebase web config</button>${demoMode?'<div class="notice" style="margin-top:12px">Demo mode is active. Firebase is bypassed on this device.</div>':''}</div>`;document.body.appendChild(gate);
 if(demoMode){const {auth}=await getBackend();gate.remove();return auth.currentUser}
 const cfg=getFirebaseConfig();if(!isFirebaseConfigured(cfg)) showConfigModal();
 const {auth}=await getBackend().catch(err=>{showError(err.message);throw err});
 return new Promise(resolve=>{
  let done=false;const off=auth.onChange(user=>{if(user&&!done){done=true;off?.();gate.remove();resolve(user)}});
  gate.querySelector('#signInBtn').onclick=async()=>{try{showError('');await auth.signIn(gate.querySelector('#authEmail').value.trim(),gate.querySelector('#authPassword').value)}catch(e){showError(e.message)}};
  const signUp=gate.querySelector('#signUpBtn');if(signUp)signUp.onclick=async()=>{try{showError('');await auth.signUp(gate.querySelector('#authEmail').value.trim(),gate.querySelector('#authPassword').value)}catch(e){showError(e.message)}};
  gate.querySelector('#firebaseSetupBtn').onclick=showConfigModal;
  function showError(msg){gate.querySelector('#authError').innerHTML=msg?`<div class="error">${esc(msg)}</div>`:''}
 });
 function showConfigModal(){
  const c=getFirebaseConfig(),m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-card"><h2 class="section-title">Firebase Web Config</h2><p class="muted">Project <b>ceremony-d1618</b>. After registering the web app named <b>Ceremony</b>, paste the public Web API key and App ID here. These values are Firebase client identifiers, not private secrets.</p><div class="stack"><div class="field"><label>API key</label><input id="cfgApiKey" value="${esc(c.apiKey||'')}"></div><div class="field"><label>App ID</label><input id="cfgAppId" value="${esc(c.appId||'')}"></div></div><div class="toolbar" style="margin-top:16px"><button class="btn primary" id="saveCfg">Save on this device</button><button class="btn" id="closeCfg">Close</button></div></div>`;document.body.appendChild(m);m.querySelector('#closeCfg').onclick=()=>m.remove();m.querySelector('#saveCfg').onclick=()=>{saveFirebaseOverride({apiKey:m.querySelector('#cfgApiKey').value.trim(),appId:m.querySelector('#cfgAppId').value.trim()});location.reload()};
 }
}
