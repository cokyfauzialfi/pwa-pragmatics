// Snippets: "Did you know?" tips (content blocks), key-term pop-ups, sentence starters for answer boxes, and a Glossary view.
(function(){
'use strict';
const A=window.APP,{el,esc,md,C,store}=A;
const GLOSS=C.glossary||[],START=C.starters||{generic:[],units:{}};
const setting=k=>store.get('settings/'+k)!=='0';

// ---------- 1. "Did you know?" tips ----------
A.BLOCKS.tip=b=>{
  const d=el('aside','tip');
  d.innerHTML=`<div class="tip-l"><span class="tip-i" aria-hidden="true">i</span>${esc(b.label||'Did you know?')}</div><p>${md(b.text)}</p>`;
  if((b.lines||[]).length){const t=el('div','tip-ex');b.lines.forEach(l=>t.appendChild(el('div','tip-r',`<span class="tip-a">${md(l[0])}</span><span class="tip-b">${md(l[1])}</span>`)));d.appendChild(t)}
  return d;
};

// ---------- 2. Key-term pop-ups ----------
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const norm=s=>s.toLowerCase().replace(/\s+/g,' ').replace(/'/g,'’');
const byKey=new Map();GLOSS.forEach(e=>e.match.forEach(m=>byKey.set(norm(m),e)));
const alts=[...byKey.keys()].sort((a,b)=>b.length-a.length).map(k=>reEsc(k).replace(/’/g,"['’]").replace(/ /g,'\\s+'));
const RE=alts.length?new RegExp('(?<![\\p{L}\\p{N}_-])('+alts.join('|')+')(?![\\p{L}\\p{N}_]|-\\p{L})','giu'):null;
const SKIP='textarea,input,select,button,label,h1,h2,h3,th,.label,.ar,.arp,.enl,.ref,.chat,.bub,.gl,.gloss,.stage-h,.anchor,.titleid,.tip-l,.quiz,.jform,.jcard,.trk,.fwx,.fw-panel,.sw-menu,.termpop,.help-side,.dev-card,.hit,.num';
let seen=new Set();
function wrapIn(node){
  const txt=node.nodeValue;RE.lastIndex=0;let m;
  while((m=RE.exec(txt))){
    const e=byKey.get(norm(m[0]));if(!e||seen.has(e.term))continue;seen.add(e.term);
    const b=document.createElement('button');b.type='button';b.className='gt';b.dataset.term=e.term;b.textContent=m[0];b.setAttribute('aria-haspopup','dialog');
    const p=node.parentNode,after=document.createTextNode(txt.slice(m.index+m[0].length));
    p.insertBefore(document.createTextNode(txt.slice(0,m.index)),node);p.insertBefore(b,node);p.insertBefore(after,node);p.removeChild(node);
    wrapIn(after);return;
  }
}
function markTerms(root){
  if(!RE||!setting('terms')||A.state.view!=='unit')return;
  seen=new Set([...root.querySelectorAll('.gt')].map(x=>x.dataset.term));
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>(n.nodeValue.trim()&&!n.parentElement.closest(SKIP))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(wrapIn);
}
function unmarkTerms(root){root.querySelectorAll('.gt').forEach(b=>{b.replaceWith(document.createTextNode(b.textContent))});root.normalize()}

const pop=el('div','termpop');pop.hidden=true;pop.setAttribute('role','dialog');document.body.appendChild(pop);
let popFor=null,popTop=0;
function place(box,anchor,w){
  const r=anchor.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;
  box.style.maxWidth=Math.min(w,vw-24)+'px';box.hidden=false;
  const bw=box.offsetWidth,bh=box.offsetHeight;
  let left=Math.max(12,Math.min(r.left,vw-bw-12)),top=r.bottom+8;
  if(top+bh>vh-12&&r.top-bh-8>12)top=r.top-bh-8;
  box.style.left=left+'px';box.style.top=Math.max(8,top)+'px';
}
function closePop(){pop.hidden=true;popFor=null}
function openTerm(btn){
  const e=GLOSS.find(g=>g.term===btn.dataset.term);if(!e)return;
  if(popFor===btn){closePop();return}
  popFor=btn;popTop=document.getElementById('main').scrollTop;pop.innerHTML=`<div class="tp-t">${esc(e.term)}</div><p>${md(e.def)}</p>${e.src?`<div class="tp-s">${esc(e.src)}</div>`:''}`;
  pop.setAttribute('aria-label',e.term);
  const u=C.units.find(x=>x.number===e.unit);
  if(u){const row=el('div','tp-f');row.appendChild(el('span',null,`Introduced in Unit ${e.unit}`));
    if(!(A.state.view==='unit'&&A.state.unitNumber===e.unit)){const g=el('button','tp-go','Open the unit');g.type='button';g.onclick=()=>{closePop();const i=u.stages.findIndex(s=>s.id==='s3');A.openUnit(u,i<0?null:i)};row.appendChild(g)}
    const gl=el('button','tp-go','Glossary');gl.type='button';gl.onclick=()=>{closePop();A.openView('glossary')};row.appendChild(gl);
    pop.appendChild(row)}
  place(pop,btn,360);
}

// ---------- 3. Sentence starters ----------
const chip=el('button','sw-btn','<span aria-hidden="true">✎</span> Starters');chip.type='button';chip.hidden=true;chip.setAttribute('aria-haspopup','menu');chip.title='Sentence starters: tap one to add it to your answer';
const menu=el('div','sw-menu');menu.hidden=true;menu.setAttribute('role','menu');
document.body.appendChild(chip);document.body.appendChild(menu);
let cur=null,hideT=null,menuTop=0;
const eligible=t=>t&&t.tagName==='TEXTAREA'&&t.classList.contains('f')&&!t.closest('.trk,.profpop')&&document.getElementById('page').contains(t);
function groupsFor(){
  const u=A.state.view==='unit'?(START.units||{})[String(A.state.unitNumber)]:null;
  return [...(u||[]),...(START.generic||[])];
}
function placeChip(){
  if(!cur||!document.body.contains(cur)){chip.hidden=true;return}
  const r=cur.getBoundingClientRect(),m=document.getElementById('main').getBoundingClientRect();
  if(r.bottom<m.top+8||r.top>m.bottom-8){chip.hidden=true;return}
  chip.hidden=false;const w=chip.offsetWidth;
  chip.style.left=Math.max(8,r.right-w-10)+'px';chip.style.top=Math.max(m.top+2,r.top-12)+'px';
}
function closeMenu(){menu.hidden=true;chip.setAttribute('aria-expanded','false')}
function insertStarter(text){
  const t=cur;if(!t)return;
  const s=text.replace(/\s*…\s*$/,'').replace(/\s+$/,'')+' ';
  const v=t.value,a=t.selectionStart==null?v.length:t.selectionStart,b=t.selectionEnd==null?v.length:t.selectionEnd;
  const before=v.slice(0,a),pre=before&&!/\s$/.test(before)?(/[.!?]$/.test(before.trim())?' ':' '):'';
  t.value=before+pre+s+v.slice(b);const pos=(before+pre+s).length;t.setSelectionRange(pos,pos);
  t.dispatchEvent(new Event('input',{bubbles:true}));t.focus();
}
function openMenu(){
  menu.innerHTML='';
  groupsFor().forEach(g=>{
    menu.appendChild(el('div','sw-g',esc(g.label)));
    g.items.forEach(it=>{const b=el('button','sw-i',esc(it));b.type='button';b.setAttribute('role','menuitem');b.onmousedown=e=>e.preventDefault();b.onclick=()=>{insertStarter(it);closeMenu()};menu.appendChild(b)})});
  menu.hidden=false;menuTop=document.getElementById('main').scrollTop;chip.setAttribute('aria-expanded','true');
  const r=chip.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;
  menu.style.maxHeight=Math.min(340,vh-24)+'px';
  const mw=menu.offsetWidth,mh=menu.offsetHeight;
  let top=r.bottom+6;if(top+mh>vh-10)top=Math.max(10,r.top-mh-6);
  menu.style.left=Math.max(10,Math.min(r.right-mw,vw-mw-10))+'px';menu.style.top=top+'px';
}
chip.onmousedown=e=>e.preventDefault();
chip.onclick=()=>{menu.hidden?openMenu():closeMenu()};
document.addEventListener('focusin',e=>{
  if(menu.contains(e.target)||e.target===chip)return;
  clearTimeout(hideT);
  if(setting('starters')&&eligible(e.target)){cur=e.target;placeChip()}else if(menu.hidden){cur=null;chip.hidden=true}
});
document.addEventListener('focusout',e=>{if(e.target===cur){hideT=setTimeout(()=>{if(menu.hidden&&document.activeElement!==cur&&document.activeElement!==chip){chip.hidden=true}},180)}});
document.addEventListener('mousedown',e=>{
  if(!menu.hidden&&!menu.contains(e.target)&&e.target!==chip)closeMenu();
  if(!pop.hidden&&!pop.contains(e.target)&&!e.target.closest('.gt'))closePop();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();closePop()}});
document.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('.gt');if(g){e.preventDefault();openTerm(g)}});
const mainEl=document.getElementById('main');
mainEl.addEventListener('scroll',()=>{if(!pop.hidden&&Math.abs(mainEl.scrollTop-popTop)>30)closePop();if(!menu.hidden&&Math.abs(mainEl.scrollTop-menuTop)>30)closeMenu();requestAnimationFrame(placeChip)},{passive:true});
window.addEventListener('resize',()=>{closePop();closeMenu();requestAnimationFrame(placeChip)});

// ---------- 4. enhance after every render ----------
const page=document.getElementById('page');let busy=false,raf=0;
const mo=new MutationObserver(()=>{if(busy)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(enhance)});
function enhance(){
  busy=true;mo.disconnect();
  try{markTerms(page);if(cur&&!document.body.contains(cur)){cur=null;chip.hidden=true;closeMenu()}closePop()}finally{mo.observe(page,{childList:true,subtree:true});busy=false}
}
mo.observe(page,{childList:true,subtree:true});

// ---------- 5. settings (used by the ribbon's Write tab) ----------
A.snippets={
  starters:{get:()=>setting('starters'),set:on=>{store.set('settings/starters',on?'1':'0');if(!on){chip.hidden=true;closeMenu()}}},
  terms:{get:()=>setting('terms'),set:on=>{store.set('settings/terms',on?'1':'0');busy=true;mo.disconnect();closePop();if(on)markTerms(page);else unmarkTerms(page);mo.observe(page,{childList:true,subtree:true});busy=false}}
};

// ---------- 6. Glossary view ----------
A.VIEWS.glossary={title:'Glossary',icon:'Aa',group:'tools',render(root){
  root.appendChild(el('div','stage-h',`<span class="tag">Reference</span><h2>Glossary of Key Terms</h2>`));
  root.appendChild(el('p','fw-help','The terms in this module, with the unit that introduces each one. Definitions follow the module text.'));
  const q=el('input','f gl-q');q.type='search';q.placeholder='Search terms';q.setAttribute('aria-label','Search the glossary');root.appendChild(q);
  const list=el('div','gl-list');root.appendChild(list);
  const sorted=[...GLOSS].sort((a,b)=>a.term.localeCompare(b.term,'en',{sensitivity:'base'}));
  const draw=()=>{
    const f=q.value.trim().toLowerCase();list.innerHTML='';
    const hits=sorted.filter(e=>!f||e.term.toLowerCase().includes(f)||e.def.toLowerCase().includes(f)||e.match.some(m=>m.toLowerCase().includes(f)));
    if(!hits.length){list.appendChild(el('p','muted','No term matches your search.'));return}
    hits.forEach(e=>{
      const d=el('article','gl-e');d.innerHTML=`<h3>${esc(e.term)}</h3><p>${md(e.def)}</p>${e.src?`<div class="tp-s">${esc(e.src)}</div>`:''}`;
      const u=C.units.find(x=>x.number===e.unit);
      if(u){const b=el('button','ulink','Unit '+e.unit);b.type='button';b.onclick=()=>{const i=u.stages.findIndex(s=>s.id==='s3');A.openUnit(u,i<0?null:i)};d.appendChild(el('div','gl-u','Introduced in ')).appendChild(b)}
      list.appendChild(d)});
  };
  q.addEventListener('input',draw);draw();
}};

// keep Developers last in the menu
{const d=A.VIEWS.developers;if(d){delete A.VIEWS.developers;A.VIEWS.developers=d}}
})();
