(() => {
'use strict';
const $=id=>document.getElementById(id),audio=$('site-audio');if(!audio)return;
const widget=$('music-widget'),panel=$('music-panel'),expand=$('music-expand'),toggle=$('music-toggle'),dockToggle=$('dock-toggle'),progress=$('music-progress'),lyrics=$('lyrics'),list=$('lyrics-lines'),status=$('music-status'),retry=$('music-retry');
let data=null,lines=[],selected=1,follow=true,demo=false,request=0,waiting=false,waitTimer;
const time=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
function setStatus(text){status.textContent=text;}
function open(){panel.hidden=false;expand.setAttribute('aria-expanded','true');$('music-close').focus({preventScroll:true});render(true);}
function close(){panel.hidden=true;expand.setAttribute('aria-expanded','false');expand.focus({preventScroll:true});}
expand.addEventListener('click',()=>panel.hidden?open():close());$('dock-open').addEventListener('click',()=>panel.hidden?open():close());$('music-close').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
function render(forceFollow=false){
 const playing=!audio.paused&&!audio.ended,current=audio.currentTime||0,duration=Number.isFinite(audio.duration)?audio.duration:48;
 widget.classList.toggle('is-playing',playing);toggle.textContent=waiting?'取消等待':playing?'Ⅱ 暂停':'▶ 演示';
 toggle.setAttribute('aria-label',waiting?'取消等待无声演示':playing?'暂停无声同步演示':'开始无声同步演示');
 dockToggle.textContent=playing?'Ⅱ':'▶';dockToggle.setAttribute('aria-label',playing?'暂停无声同步演示':'继续无声同步演示');
 $('music-current').textContent=time(current);$('music-duration').textContent=time(duration);
 progress.max=duration;progress.value=current;progress.setAttribute('aria-valuetext',time(current)+' / '+time(duration));
 progress.disabled=!(Number.isFinite(audio.duration)&&data);
 $('dock-progress').max=duration;$('dock-progress').value=current;
 dockToggle.hidden=!demo;$('dock-progress').hidden=!demo;
 $('dock-title').textContent=demo?'无声同步示例':$('music-heading').textContent;
 $('dock-status').textContent=demo?(playing?'示例进行中':'示例已暂停'):'原曲接入待确认';
 let active=-1;for(let i=0;i<lines.length;i++){if(current>=lines[i].time)active=i;}
 [...list.children].forEach((li,i)=>{
  const changed=li.classList.contains('is-current')!==(i===active);
  li.classList.toggle('is-current',i===active);
  if(i===active){li.setAttribute('aria-current','true');if((changed||forceFollow===true)&&follow&&(playing||forceFollow===true)&&!panel.hidden){lyrics.scrollTo({top:Math.max(0,li.offsetTop-lyrics.clientHeight/2+li.clientHeight/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
  else li.removeAttribute('aria-current');
 });
}
function clearWait(){waiting=false;clearTimeout(waitTimer);}
function wait(){clearTimeout(waitTimer);waitTimer=setTimeout(()=>{if(waiting||(!audio.paused&&audio.readyState<3)){setStatus('示例加载较慢，可以收起面板，稍后重试。');retry.hidden=false;}},8000);}
async function playPause(){
 if(!data){setStatus('示例文字未加载，请重试。');retry.hidden=false;return;}
 if(waiting||!audio.paused){request++;clearWait();audio.pause();setStatus('已暂停，进度保留。');render();return;}
 const seq=++request;waiting=true;demo=true;wait();render();
 try{await audio.play();if(seq!==request){audio.pause();return;}clearWait();document.dispatchEvent(new Event('xiaoyu:soundtrack-start'));setStatus('正在运行无声示例；这不是原曲。');retry.hidden=true;}
 catch(e){if(seq!==request)return;clearWait();setStatus('示例没有开始，请重试。');retry.hidden=false;}
 render();
}
toggle.addEventListener('click',playPause);dockToggle.addEventListener('click',playPause);
audio.addEventListener('play',()=>{demo=true;render();});
audio.addEventListener('playing',()=>{clearWait();setStatus('正在运行无声示例；这不是原曲。');render();});
audio.addEventListener('pause',()=>{clearWait();render();});
['timeupdate','loadedmetadata','durationchange','seeked','ended'].forEach(e=>audio.addEventListener(e,render));
audio.addEventListener('waiting',()=>{setStatus('正在加载无声示例…');wait();});
audio.addEventListener('error',()=>{clearWait();setStatus('无声示例暂时无法加载，请重试。');retry.hidden=false;render();});
progress.addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(progress.value);demo=true;render(true);}});
function setFollow(value){follow=value;$('music-follow').setAttribute('aria-pressed',String(follow));$('music-follow').textContent=follow?'跟随当前句':'恢复跟随';}
$('music-follow').addEventListener('click',()=>{setFollow(!follow);render(true);});
['wheel','touchstart','pointerdown','keydown'].forEach(e=>lyrics.addEventListener(e,()=>setFollow(false),{passive:e!=='keydown'}));
function choose(index){
 selected=index;request++;clearWait();audio.pause();demo=false;
 const track=data?.tracks[index];if(!track)return;
 $('music-heading').textContent=track.title;$('music-artist').textContent=track.artist;
 $('music-official').hidden=!track.officialUrl;if(track.officialUrl)$('music-official').href=track.officialUrl;
 document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.track)===index)));render();
}
document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.track))));
document.addEventListener('xiaoyu:chapter-media-start',()=>{request++;clearWait();audio.pause();setStatus('作品开始播放，示例已暂停。可以稍后主动继续。');render();});
$('music-official').addEventListener('click',()=>{request++;clearWait();audio.pause();render();});
async function loadData(){
 try{
 const response=await fetch('./data/music-preview.json');if(!response.ok)throw Error('Data unavailable');data=await response.json();lines=data.demo.lines;
 list.replaceChildren(...lines.map((line,i)=>{const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=line.text;button.setAttribute('aria-label','跳到 '+time(line.time)+'，'+line.text);button.addEventListener('click',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=line.time;demo=true;render();}});li.append(button);return li;}));
 retry.hidden=!audio.error;choose(selected);render();
 }catch(e){setStatus('示例文字暂时无法加载，请重试。');retry.hidden=false;progress.disabled=true;}
}
retry.addEventListener('click',()=>{request++;clearWait();audio.pause();audio.load();setStatus('重新加载中，请点击演示开始。');if(!data)loadData();else render();});
loadData();
})();
