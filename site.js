(() => {
  'use strict';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.character-button').forEach(button => button.addEventListener('click', () => {
    button.classList.remove('is-greeting');
    void button.offsetWidth;
    button.classList.add('is-greeting');
    const message=document.getElementById('character-message');
    if(message)message.textContent='嗨，欢迎来逛逛！';
    setTimeout(()=>button.classList.remove('is-greeting'),650);
  }));
  const stage=document.getElementById('graph-stage');
  if(!stage) return;
  const filters=[...document.querySelectorAll('[data-graph-filter]')];
  const title=document.getElementById('graph-node-title');
  const description=document.getElementById('graph-node-description');
  const neighbors=document.getElementById('graph-neighbors');
  const svgNS='http://www.w3.org/2000/svg';
  const colors={hub:'#f08a5b',reading:'#80b6c8',method:'#bdacd7',practice:'#a9c59d'};
  function element(tag,attrs={}) { const e=document.createElementNS(svgNS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v))); return e; }
  fetch('./data/fishflow-graph.json').then(response => { if(!response.ok) throw Error('Graph unavailable'); return response.json(); }).then(data => {
    const byId=new Map(data.nodes.map(n=>[n.id,n]));
    const originalPositions=new Map(data.nodes.map(n=>[n.id,{x:n.x,y:n.y}]));
    const svg=element('svg',{viewBox:'0 0 900 610',class:'graph-svg',role:'group','aria-label':'可选择节点的 FishFlow 公开笔记关系图'});
    const nodeElements=new Map(),edgeElements=[];
    const edgeLayer=element('g',{'aria-hidden':'true'});
    data.edges.forEach(edge => {
      const a=byId.get(edge.source),b=byId.get(edge.target);
      if(!a||!b)return;
      const line=element('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'graph-edge'});
      line.style.setProperty('--edge-length',Math.hypot(b.x-a.x,b.y-a.y)+'px');
      edgeLayer.append(line);edgeElements.push({edge,line});
    });
    svg.append(edgeLayer);
    let group='all', selected=null;
    function drawLayout(){
      nodeElements.forEach((g,id)=>{const n=byId.get(id);g.setAttribute('transform','translate('+n.x+' '+n.y+')');});
      edgeElements.forEach(({edge,line})=>{const a=byId.get(edge.source),b=byId.get(edge.target);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);});
    }
    function moveNode(n,x,y){n.x=Math.max(55,Math.min(845,x));n.y=Math.max(45,Math.min(565,y));drawLayout();}
    function resetDescription() {
      title.textContent = group==='all' ? 'FishFlow 的公开笔记关系' : ({reading:'阅读之间的连接',method:'方法与认识之间的连接',practice:'回到实际使用'}[group]);
      description.textContent = '点选节点查看相连笔记；拖动节点或用方向键调整布局。布局只影响本次浏览，点“重置布局”可恢复。手机上可左右滑动图谱。';
      neighbors.replaceChildren();
    }
    function renderSelection() {
      const connected = new Set();
      if(selected) {
        connected.add(selected);
        data.edges.forEach(e => { if(e.source===selected)connected.add(e.target); if(e.target===selected)connected.add(e.source); });
      }
      nodeElements.forEach((g,id)=>{
        const n=byId.get(id);
        const muted=selected ? !connected.has(id) : group!=='all' && n.group!==group && n.group!=='hub';
        g.classList.toggle('is-muted',muted);
        g.classList.toggle('is-selected',id===selected);
        g.setAttribute('aria-pressed',String(id===selected));
      });
      edgeElements.forEach(({edge,line})=>{
        const isConnected = selected && (edge.source===selected||edge.target===selected);
        const matchesGroup=group==='all'||byId.get(edge.source).group===group||byId.get(edge.target).group===group;
        line.classList.toggle('is-connected',!!isConnected);
        line.classList.toggle('is-muted', selected ? !isConnected : !matchesGroup);
      });
      if(selected) {
        const n=byId.get(selected);
        const list=[...connected].filter(id=>id!==selected).map(id=>byId.get(id));
        title.textContent=n.label;
        description.textContent='在选取的公开子图里，这篇笔记与以下 '+list.length+' 篇笔记存在双链关系。';
        neighbors.replaceChildren(...list.map(note=>{const span=document.createElement('span');span.textContent=note.label;return span;}));
      } else resetDescription();
    }
    data.nodes.forEach((n,index)=>{
      const g=element('g',{class:'graph-node',transform:'translate('+n.x+' '+n.y+')',tabindex:'0',role:'button','aria-label':n.label+'，查看连接','aria-pressed':'false','data-node':n.id});
      g.style.setProperty('--node-delay',index*18+'ms');
      g.append(element('circle',{r:23,fill:'transparent',class:'node-hit'}));
      g.append(element('circle',{r:21,class:'node-halo'}));
      g.append(element('circle',{r:n.id==='home'?15:n.group==='hub'?9:6,fill:colors[n.group]}));
      const text=element('text',{y:31,'text-anchor':'middle',class:'node-label'});
      text.textContent=n.label;g.append(text);
      function select() { selected=selected===n.id?null:n.id; renderSelection(); }
      let pointer=null,dragged=false;
      g.addEventListener('pointerdown',event=>{
        if(event.button!==0||!event.isPrimary)return;
        event.preventDefault();dragged=false;
        pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:n.x,startY:n.y};
        g.setPointerCapture(event.pointerId);g.focus({preventScroll:true});
      });
      g.addEventListener('pointermove',event=>{
        if(!pointer||pointer.id!==event.pointerId)return;
        const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
        if(!dragged&&Math.hypot(dx,dy)<6)return;
        dragged=true;g.classList.add('is-dragging');
        const matrix=svg.getScreenCTM();if(!matrix)return;
        moveNode(n,pointer.startX+dx/matrix.a,pointer.startY+dy/matrix.d);
      });
      function release(event){if(pointer?.id===event.pointerId){pointer=null;g.classList.remove('is-dragging');}}
      g.addEventListener('pointerup',release);g.addEventListener('pointercancel',release);g.addEventListener('lostpointercapture',release);
      g.addEventListener('click',()=>{if(dragged){dragged=false;return;}select();});
      g.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();dragged=false;select();}
        if(event.key==='Escape'){selected=null;renderSelection();}
        const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if(moves[event.key]){event.preventDefault();const d=moves[event.key],step=event.shiftKey?25:10;moveNode(n,n.x+d[0]*step,n.y+d[1]*step);}
      });
      svg.append(g);nodeElements.set(n.id,g);
    });
    stage.replaceChildren(svg);
    function introduce(){if(motionPreference.matches)return;svg.classList.add('is-introducing');setTimeout(()=>svg.classList.remove('is-introducing'),1250);}
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){introduce();observer.disconnect();}},{threshold:.15});observer.observe(stage);}else introduce();
    if (innerWidth <= 760) requestAnimationFrame(() => { stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2; });
    filters.forEach(button=>button.addEventListener('click',()=>{
      group=button.dataset.graphFilter;selected=null;
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderSelection();
    }));
    const reset=document.getElementById('graph-reset');
    if(reset)reset.addEventListener('click',()=>{
      data.nodes.forEach(n=>Object.assign(n,originalPositions.get(n.id)));group='all';selected=null;
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.graphFilter==='all')));
      drawLayout();renderSelection();introduce();
    });
    renderSelection();
  }).catch(()=>{
    filters.forEach(button=>button.disabled=true);
    description.textContent='交互图谱暂时无法加载，仍可查看上方静态关系图。';
  });
})();
