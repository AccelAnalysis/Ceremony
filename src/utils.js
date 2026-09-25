export const qs=(sel,root=document)=>root.querySelector(sel);
export const qsa=(sel,root=document)=>[...root.querySelectorAll(sel)];
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const uid=(prefix='id')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
export const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
export const eventIdFromUrl=()=>new URLSearchParams(location.search).get('event')||localStorage.getItem('ceremony.lastEventId')||'ak9i-graduation';
export function rememberEventId(id){localStorage.setItem('ceremony.lastEventId',id)}
export const dateInputValue=d=>{if(!d)return'';const x=new Date(d),p=n=>String(n).padStart(2,'0');return `${x.getFullYear()}-${p(x.getMonth()+1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`};
export const msToCountdown=ms=>{if(ms<=0)return'00:00:00';const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
export function formatClock(date,format='12'){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit',hour12:format!=='24'}).format(date)}
