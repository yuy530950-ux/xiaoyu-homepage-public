(() => {
'use strict';
const root=document.getElementById('life-player');if(!root)return;
const tabs=[...root.querySelectorAll('[role=tab]')],panels=[...root.querySelectorAll('[role=tabpanel]')];
const film=document.getElementById('training-film'),frame=document.getElementById('fnf-frame'),cover=document.getElementById('fnf-play'),stop=document.getElementById('fnf-stop');
let active='training',animation;
function stopMedia(){film.pause();frame.src='about:blank';frame.hidden=true;cover.hidden=false;stop.hidden=true;}
function select(key,focus=false){
 if(!tabs.some(t=>t.dataset.chapter===key))return;
 if(active!==key){stopMedia();active=key;root.dataset.chapter=key;}
 tabs.forEach(t=>{const on=t.dataset.chapter===key;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});
 panels.forEach(p=>p.hidden=p.id!=='chapter-'+key);
 if(animation)animation.cancel();
 const panel=panels.find(p=>!p.hidden);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)animation=panel.animate([{opacity:.35,transform:'perspective(1200px) rotateY(-5deg) translateX(12px)'},{opacity:1,transform:'perspective(1200px) rotateY(0) translateX(0)'}],{duration:440,easing:'cubic-bezier(.2,.7,.2,1)'});
}
tabs.forEach((t,i)=>{
 t.addEventListener('click',()=>select(t.dataset.chapter));
 t.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(tabs[n].dataset.chapter,true);});
});
cover.addEventListener('click',()=>{
 document.dispatchEvent(new Event('xiaoyu:chapter-media-start'));
 film.pause();frame.src='https://player.bilibili.com/player.html?bvid=BV1u64y1v7vH&page=1&autoplay=1&danmaku=0';frame.hidden=false;cover.hidden=true;stop.hidden=false;
});
stop.addEventListener('click',()=>{stopMedia();cover.focus();});
film.addEventListener('play',()=>{
 document.dispatchEvent(new Event('xiaoyu:chapter-media-start'));
 frame.src='about:blank';frame.hidden=true;cover.hidden=false;stop.hidden=true;
});
document.addEventListener('xiaoyu:soundtrack-start',stopMedia);
const hashes={'#training-record':'training','#film-record':'creative','#fnf-record':'creative','#fishflow-record':'tools','#reading-record':'reading'};
function route(){const key=hashes[location.hash];if(key){select(key);document.getElementById('records').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
addEventListener('hashchange',route);route();
})();
