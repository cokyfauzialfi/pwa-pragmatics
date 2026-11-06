// About the App, How to Use the App (help centre), Developers, and the pillar icons.
(function(){
'use strict';
const A=window.APP,{el,esc,md,C}=A;
const INFO=C.info;
const PIL=()=>A.PILLARS||{};
const ORDER=['Cinta Allah dan Rasul-Nya','Cinta Ilmu','Cinta Diri dan Sesama Manusia','Cinta Lingkungan','Cinta Tanah Air'];
A.pillarIcon=(name,size)=>{const p=PIL()[name];if(!p)return '';return `<span class="pi pi-${p.key}" style="width:${size||22}px;height:${size||22}px"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${p.svg}</svg></span>`};
A.pillarsForUnit=n=>{const r=C.framework.rows.find(x=>x.unit===n);if(!r)return [];return r.pillars.includes('All five pillars')?ORDER.slice():r.pillars.filter(x=>PIL()[x])};
A.pillarIcons=n=>{const l=A.pillarsForUnit(n);return l.length?`<div class="pi-row">${l.map(x=>`<span class="pi-i" title="${esc(x)}">${A.pillarIcon(x,26)}</span>`).join('')}</div>`:''};
A.BLOCKS.pillars=()=>{const w=el('div','pi-legend');ORDER.forEach(n=>w.appendChild(el('div','pi-leg',`${A.pillarIcon(n,44)}<span>${esc(n)}</span>`)));return w};

function simplePage(page,tag,title){page.appendChild(el('div','stage-h',`<span class="tag">${esc(tag)}</span><h2>${esc(title)}</h2>`))}

A.VIEWS.about={group:'info',title:'About the App',icon:'ⓘ',render(page){
  simplePage(page,'The app',INFO.about.title);
  INFO.about.blocks.forEach(b=>page.appendChild(A.renderBlock(b,{id:'info',number:0})));
  page.appendChild(el('p','muted',`Version ${esc(C.version||'')}`));
}};

A.VIEWS.help={group:'info',title:'How to Use the App',icon:'?',render(page){
  simplePage(page,'Help',INFO.help.title);
  let topics=INFO.help.topics.slice();
  if(A.unlocked&&A.unlocked())topics=topics.concat([{id:'inst',title:'Instructor mode',keywords:'instructor lock unlock',blocks:[{type:'p',text:'Instructor guidance appears as a dashed panel at the end of each stage, and the unit Overview carries the materials and timing. Select **Instructor mode on · Lock** at the bottom of the menu to hide it again.'}]}]);
  let cur=topics[0].id,q='';
  const wrap=el('div','help');const side=el('div','help-side');const art=el('article','help-art');
  const search=el('input','f');search.type='search';search.placeholder='Search help';search.setAttribute('aria-label','Search help');
  const list=el('nav','help-list');side.appendChild(search);side.appendChild(list);wrap.appendChild(side);wrap.appendChild(art);page.appendChild(wrap);
  const text=t=>(t.title+' '+(t.keywords||'')+' '+JSON.stringify(t.blocks)).toLowerCase();
  function draw(){
    const shown=topics.filter(t=>!q||text(t).includes(q));
    list.innerHTML='';
    shown.forEach(t=>{const b=el('button',null,esc(t.title));b.type='button';if(t.id===cur)b.setAttribute('aria-current','true');b.onclick=()=>{cur=t.id;draw()};list.appendChild(b)});
    if(!shown.length)list.appendChild(el('p','muted','No topic matches your search.'));
    const t=topics.find(x=>x.id===cur&&shown.includes(x))||shown[0];
    art.innerHTML='';if(!t)return;
    art.appendChild(el('h3',null,esc(t.title)));
    t.blocks.forEach(b=>art.appendChild(A.renderBlock(b,{id:'info',number:0})));
  }
  search.oninput=()=>{q=search.value.trim().toLowerCase();draw()};
  draw();
}};

A.VIEWS.developers={group:'info',title:'Developers',icon:'❖',render(page){
  const D=INFO.developers;simplePage(page,'The team',D.title);
  page.appendChild(el('p',null,esc(D.intro)));
  const g=el('div','dev-grid');
  D.people.forEach(p=>{const ini=p.name.split(/\s+/).map(w=>w[0]).slice(0,2).join('');g.appendChild(el('div','dev-card',`<div class="dev-av" aria-hidden="true">${esc(ini)}</div><div><div class="dev-n">${esc(p.name)}</div><div class="muted">${esc(p.role)}</div></div>`))});
  page.appendChild(g);
  page.appendChild(el('h3',null,'Credits'));
  page.appendChild(el('ul','l',D.credits.map(c=>`<li>${md(c)}</li>`).join('')));
}};
})();
