import {esc,clamp} from './utils.js';
export {esc,clamp};
export const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d};
export function input(label,value='',type='text',attrs=''){return `<div class="field"><label>${esc(label)}</label><input type="${type}" value="${esc(value??'')}" ${attrs}></div>`}
export function notice(html){return `<div class="notice">${html}</div>`}
export function modal(title,body){const el=document.createElement('div');el.className='modal';el.innerHTML=`<div class="modal-card wide"><h2 class="section-title">${esc(title)}</h2>${body}</div>`;document.body.appendChild(el);return el}
export function closeOnCancel(el){el.querySelector('[data-cancel]')?.addEventListener('click',()=>el.remove())}
export function toast(message){const old=document.querySelector('.toast');old?.remove();const t=document.createElement('div');t.className='toast';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
export function layoutValue(root,key,field){return root.querySelector(`[data-k="${key}"][data-f="${field}"]`)}
