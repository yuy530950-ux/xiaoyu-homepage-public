(() => {
'use strict';
const root=document.getElementById('life-player');if(!root)return;
const film=document.getElementById('training-film'),filmPlay=document.getElementById('training-film-play');
const frame=document.getElementById('fnf-frame'),cover=document.getElementById('fnf-play'),stop=document.getElementById('fnf-stop');
function stopEmbedded(){frame.src='about:blank';frame.hidden=true;cover.hidden=false;stop.hidden=true;}
function stopMedia(){film.pause();stopEmbedded();}
filmPlay.addEventListener('click',()=>{
 film.play().then(()=>film.focus({preventScroll:true})).catch(()=>{filmPlay.textContent='▶ 重试播放视频';});
});
function showFilmPlay(){filmPlay.hidden=false;filmPlay.textContent=film.currentTime>0&&!film.ended?'▶ 继续播放视频':'▶ 播放这条视频';}
film.addEventListener('pause',showFilmPlay);film.addEventListener('ended',showFilmPlay);
cover.addEventListener('click',()=>{
 document.dispatchEvent(new Event('xiaoyu:chapter-media-start'));
 film.pause();frame.src='https://player.bilibili.com/player.html?bvid=BV1u64y1v7vH&page=1&autoplay=1&danmaku=0';frame.hidden=false;cover.hidden=true;stop.hidden=false;
});
stop.addEventListener('click',()=>{stopEmbedded();cover.focus();});
film.addEventListener('play',()=>{
 filmPlay.hidden=true;
 document.dispatchEvent(new Event('xiaoyu:chapter-media-start'));
 stopEmbedded();
});
document.addEventListener('xiaoyu:soundtrack-start',stopMedia);
// All records stay visible. Existing story anchors now use native navigation.
})();
