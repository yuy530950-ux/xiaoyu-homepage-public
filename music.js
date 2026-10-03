(() => {
'use strict';
const $=id=>document.getElementById(id),audio=$('site-audio');if(!audio)return;
const widget=$('music-widget'),panel=$('music-panel'),expand=$('music-expand'),toggle=$('music-toggle'),dockToggle=$('dock-toggle'),progress=$('music-progress'),lyrics=$('lyrics'),list=$('lyrics-lines'),status=$('music-status'),retry=$('music-retry');
const buttons=[...document.querySelectorAll('[data-track]')];
let data=null,selected=0,lines=[],follow=true,pending=false,buffering=false,request=0,waitTimer,lastLine=-1;
const coarse=matchMedia('(pointer:coarse)').matches;
audio.volume=coarse?1:.25;$('music-volume').value=audio.volume;
const time=n=>Math.floor(Math.max(0,n)/60)+':'+String(Math.floor(Math.max(0,n)%60)).padStart(2,'0');
const track=()=>data?.tracks[selected]||{title:'Rebound',artist:'Josh Woodward',mood:'清爽电子流行',duration:174.035,instrumental:false};
function setStatus(text){status.textContent=text;}
function open(){panel.hidden=false;expand.setAttribute('aria-expanded','true');$('music-close').focus({preventScroll:true});render(true);}
function close(){panel.hidden=true;expand.setAttribute('aria-expanded','false');expand.focus({preventScroll:true});}
expand.addEventListener('click',()=>panel.hidden?open():close());$('dock-open').addEventListener('click',()=>panel.hidden?open():close());$('music-close').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
function clearWait(){clearTimeout(waitTimer);}
function watchWait(){clearWait();waitTimer=setTimeout(()=>{if(pending||buffering){setStatus('加载较慢，可以收起面板，稍后重试。');retry.hidden=false;}},8000);}
function render(forceFollow=false){
 const current=audio.currentTime||0,t=track(),duration=Number.isFinite(audio.duration)?audio.duration:t.duration;
 const playing=!audio.paused&&!audio.ended&&!buffering;
 widget.classList.toggle('is-playing',playing);
 toggle.textContent=pending?'取消等待':!audio.paused?'Ⅱ 暂停':'▶ 播放';
 const label=pending?'取消加载':!audio.paused?'暂停 '+t.title:'播放 '+t.title;
 toggle.setAttribute('aria-label',label);dockToggle.setAttribute('aria-label',label);
 dockToggle.textContent=pending?'■':!audio.paused?'Ⅱ':'▶';
 $('music-current').textContent=time(current);$('music-duration').textContent=time(duration);
 progress.max=duration;progress.value=current;progress.disabled=!Number.isFinite(audio.duration);
 progress.setAttribute('aria-valuetext',time(current)+' / '+time(duration));
 $('dock-progress').max=duration;$('dock-progress').value=current;
 $('dock-title').textContent=t.title;
 $('dock-status').textContent=buffering?'加载中…':!audio.paused?'正在播放 · '+t.mood:t.mood;
 let active=-1;for(let i=0;i<lines.length;i++){if(current>=lines[i].time&&current<lines[i].end)active=i;}
 [...list.children].forEach((li,i)=>{li.classList.toggle('is-current',i===active);if(i===active)li.setAttribute('aria-current','true');else li.removeAttribute('aria-current');});
 if(active>=0&&follow&&!panel.hidden&&(active!==lastLine||forceFollow===true)){
  const li=list.children[active];lyrics.scrollTo({top:Math.max(0,li.offsetTop-lyrics.clientHeight/2+li.clientHeight/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 lastLine=active;
}
function pause(message='已暂停，进度保留。'){request++;pending=false;buffering=false;clearWait();audio.pause();setStatus(message);render();}
async function start(){
 const seq=++request;pending=true;buffering=false;setStatus('正在加载…');watchWait();render();
 try{await audio.play();if(seq!==request)return;pending=false;clearWait();retry.hidden=!audio.error;render();}
 catch(e){if(seq!==request)return;pending=false;buffering=false;clearWait();setStatus('歌曲没有开始，请重试。');retry.hidden=false;render();}
}
function playPause(){if(pending||!audio.paused)pause();else start();}
toggle.addEventListener('click',playPause);dockToggle.addEventListener('click',playPause);
audio.addEventListener('play',()=>{document.dispatchEvent(new Event('xiaoyu:soundtrack-start'));render();});
audio.addEventListener('playing',()=>{pending=false;buffering=false;clearWait();retry.hidden=true;setStatus('正在播放 '+track().title+'。收起面板也会继续。');render();});
audio.addEventListener('pause',()=>{buffering=false;render();});
['timeupdate','loadedmetadata','durationchange','seeked','ended','volumechange'].forEach(e=>audio.addEventListener(e,render));
audio.addEventListener('waiting',()=>{buffering=true;setStatus('正在加载…');watchWait();render();});
audio.addEventListener('error',()=>{request++;pending=false;buffering=false;clearWait();setStatus('这首歌暂时无法加载，请重试或换一首。');retry.hidden=false;render();});
progress.addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(progress.value);render(true);}});
function setFollow(value){follow=value;$('music-follow').setAttribute('aria-pressed',String(value));$('music-follow').textContent=value?'跟随当前句':'恢复跟随';}
$('music-follow').addEventListener('click',()=>{setFollow(!follow);render(true);});
['wheel','touchstart','pointerdown','keydown'].forEach(e=>lyrics.addEventListener(e,()=>setFollow(false),{passive:e!=='keydown'}));
$('music-volume').addEventListener('input',()=>{audio.volume=Number($('music-volume').value);audio.muted=audio.volume===0;updateMute();});
function updateMute(){$('music-mute').setAttribute('aria-pressed',String(audio.muted));$('music-mute').textContent=audio.muted?'取消静音':'静音';}
$('music-mute').addEventListener('click',()=>{audio.muted=!audio.muted;updateMute();});
function displayTrack(){
 const t=track();lines=t.lyrics||[];lastLine=-1;setFollow(true);
 $('music-heading').textContent=t.title;$('music-artist').textContent=t.artist;
 $('music-mood').textContent=t.mood+' · '+t.description;
 $('music-source').textContent=t.title+' — '+t.artist;$('music-source').href=t.sourceUrl;
 $('music-license').textContent=t.license;$('music-license').href=t.licenseUrl;
 document.querySelector('.music-credit span').textContent=t.instrumental?'原音频未改动':'原音频未改动 · 歌词分句与时间整理';
 $('lyric-heading').textContent=t.instrumental?'纯音乐':'完整歌词 · 逐句高亮';
 $('instrumental-note').hidden=!t.instrumental;list.hidden=t.instrumental;$('lyrics-note').hidden=t.instrumental;$('music-follow').hidden=t.instrumental;
 list.replaceChildren(...lines.map(line=>{const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=line.text;button.setAttribute('aria-label','跳到 '+time(line.time)+'，'+line.text);button.addEventListener('click',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=line.time;render(true);}});li.append(button);return li;}));
 lyrics.scrollTop=0;buttons.forEach(b=>{b.disabled=false;b.setAttribute('aria-pressed',String(Number(b.dataset.track)===selected));});render(true);
}
function choose(index){
 if(!data){setStatus('选曲正在加载，请稍后重试。');retry.hidden=false;return;}
 if(index===selected)return;
 const resume=!audio.paused||pending;pause('已切换歌曲，点播放开始。');selected=index;
 audio.src=track().src;audio.load();displayTrack();retry.hidden=true;
 if(resume)start();
}
buttons.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.track))));
document.addEventListener('xiaoyu:chapter-media-start',()=>pause('作品开始播放，音乐已暂停。可以稍后主动继续。'));
async function loadData(){
 try{const r=await fetch('./data/music.json');if(!r.ok)throw Error('Track data unavailable');const loaded=await r.json();
  if(loaded.tracks.length!==3||loaded.tracks.some(t=>!t.src.startsWith('./media/')))throw Error('Invalid track data');
  data=loaded;displayTrack();retry.hidden=!audio.error;
 }catch(e){setStatus('选曲与歌词暂时未加载。默认歌曲仍可播放，请重试。');retry.hidden=false;}
}
retry.addEventListener('click',()=>{if(!data){loadData();return;}pause('重新加载中…');audio.load();start();});
loadData();render();
})();
