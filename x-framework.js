// Interactive Table 1: filter by qaulan principle or Panca Cinta pillar, read the anchor verse, jump to a unit.
(function(){
'use strict';
const A=window.APP,{el,esc,md,C}=A;
const F=C.framework;
const parts=r=>(r.note||'').split(';').map(s=>s.trim()).filter(Boolean);
const supportOf=r=>parts(r).filter(s=>/ in support$/.test(s)).map(s=>s.replace(/ in support$/,''));
const noteRest=r=>parts(r).filter(s=>!/ in support$/.test(s)).join('; ');
const unitOf=n=>C.units.find(u=>u.number===n);
const qNames=()=>{const s=[];F.rows.forEach(r=>r.qaulan.forEach(q=>{if(q.name!=='All six'&&!s.includes(q.name))s.push(q.name)}));return s};
const pNames=()=>F.pillarList||[];
const isAllQ=r=>r.qaulan.some(q=>q.name==='All six');
const isAllP=r=>r.pillars.includes('All five pillars');
function match(r,sel){
  if(!sel)return '';
  if(sel.k==='q'){if(isAllQ(r)||r.qaulan.some(q=>q.name===sel.n))return 'hit';return supportOf(r).includes(sel.n)?'sup':'dim'}
  if(isAllP(r)||r.pillars.includes(sel.n))return 'hit';return supportOf(r).includes(sel.n)?'sup':'dim';
}
function render(root,opts){
  const cur=(opts||{}).current;let sel=null;
  root.innerHTML='';
  const wrap=el('div','fwx');root.appendChild(wrap);
  function draw(){
    wrap.innerHTML='';
    wrap.appendChild(el('p','fw-help','Select a qaulan principle or a Panca Cinta pillar to see where it appears across the units. Select a unit number to open that unit.'));
    const bars=el('div','fw-bars');
    const mk=(label,kind,names)=>{const g=el('div','fw-bar');g.appendChild(el('span','fw-bl',esc(label)));
      names.forEach(n=>{const b=el('button','chip '+kind,(kind==='p'?A.pillarIcon(n,16):'')+esc(n));b.type='button';const on=sel&&sel.k===kind&&sel.n===n;b.setAttribute('aria-pressed',String(!!on));
        b.onclick=()=>{sel=on?null:{k:kind,n};draw()};g.appendChild(b)});return g};
    bars.appendChild(mk('Qaulan','q',qNames()));bars.appendChild(mk('Pillar','p',pNames()));
    if(sel){const c=el('button','ghost fw-clear','Clear selection');c.type='button';c.onclick=()=>{sel=null;draw()};bars.appendChild(c)}
    wrap.appendChild(bars);
    const tw=el('div','tbl-wrap');const t=el('table','t fw');
    t.innerHTML='<thead><tr>'+F.columns.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead>';
    const tb=el('tbody');
    F.rows.forEach(r=>{
      const m=match(r,sel);const tr=el('tr',(m?'m-'+m:'')+(cur===r.unit?' cur':''));
      const td0=el('td');const u=unitOf(r.unit);
      if(u){const b=el('button','ulink','Unit '+r.unit);b.type='button';b.onclick=()=>A.openUnit(u);td0.appendChild(b)}else td0.textContent='Unit '+r.unit;
      if(cur===r.unit)td0.appendChild(el('small','here','You are here'));
      tr.appendChild(td0);
      tr.appendChild(el('td',null,md(r.focus)));
      const tq=el('td');
      r.qaulan.forEach(q=>{
        if(q.name==='All six'){tq.appendChild(el('span','q-all',md(q.gloss)));return}
        const b=el('button','chip q',esc(q.name)+(q.ref?` <small>${esc(q.ref)}</small>`:''));b.type='button';
        const on=sel&&sel.k==='q'&&sel.n===q.name;b.setAttribute('aria-pressed',String(!!on));b.title=q.gloss||'';
        b.onclick=()=>{sel=on?null:{k:'q',n:q.name};draw()};tq.appendChild(b);
        tq.appendChild(el('span','q-gl',md(q.gloss||'')))});
      tr.appendChild(tq);
      const tp=el('td');
      r.pillars.forEach(p=>{
        if(p==='All five pillars'){tp.appendChild(el('span','q-all','All five pillars'));return}
        const b=el('button','chip p',A.pillarIcon(p,16)+esc(p));b.type='button';const on=sel&&sel.k==='p'&&sel.n===p;b.setAttribute('aria-pressed',String(!!on));
        b.onclick=()=>{sel=on?null:{k:'p',n:p};draw()};tp.appendChild(b)});
      supportOf(r).forEach(n=>{
        const kind=qNames().includes(n)?'q':'p';
        const b=el('button','chip sup '+kind,(kind==='p'?A.pillarIcon(n,16):'')+esc(n)+' <small>in support</small>');b.type='button';
        const on=sel&&sel.k===kind&&sel.n===n;b.setAttribute('aria-pressed',String(!!on));
        b.onclick=()=>{sel=on?null:{k:kind,n};draw()};tp.appendChild(b)});
      const nr=noteRest(r);if(nr)tp.appendChild(el('span','q-gl',md(nr)));
      tr.appendChild(tp);tb.appendChild(tr)});
    t.appendChild(tb);tw.appendChild(t);wrap.appendChild(tw);
    wrap.appendChild(panel());
  }
  function panel(){
    const p=el('section','fw-panel');p.setAttribute('aria-live','polite');
    if(!sel){p.appendChild(el('p','fw-help','Nothing selected yet.'));return p}
    const prim=F.rows.filter(r=>match(r,sel)==='hit'),sup=F.rows.filter(r=>match(r,sel)==='sup');
    const head=sel.k==='q'?'Qaulan '+sel.n:sel.n;
    p.appendChild(el('h3','fw-h',(sel.k==='p'?A.pillarIcon(sel.n,34):'')+esc(head)));
    const ul=el('ul','l');
    prim.forEach(r=>{
      let extra='';
      if(sel.k==='q'){const q=r.qaulan.find(x=>x.name===sel.n)||r.qaulan[0];extra=` · ${esc(q.gloss||'')}${q.ref?' ('+esc(q.ref)+')':''}`}
      ul.appendChild(el('li',null,`<b>Unit ${r.unit}</b> · ${md(r.focus)}${extra}`))});
    sup.forEach(r=>ul.appendChild(el('li',null,`<b>Unit ${r.unit}</b> · ${md(r.focus)} <span class="muted">(in support)</span>`)));
    p.appendChild(ul);
    const nine=prim.find(r=>r.unit===9&&noteRest(r));if(nine&&sel.k==='p')p.appendChild(el('p','muted',md('Unit 9: '+noteRest(nine)+'.')));
    if(sel.k==='q'){
      const seen=new Set();
      prim.forEach(r=>r.qaulan.forEach(q=>{if(q.name===sel.n&&q.verse&&!seen.has(q.verse)){seen.add(q.verse);
        p.appendChild(el('div','box anchor',`<div class="label">Qur’anic anchor · Qaulan ${esc(q.name)}</div>${A.verseHTML(q.verse)}`))}}));
      if(!seen.size)p.appendChild(el('p','muted','No verse is paired with this principle in the module’s Table 1.'));
    }
    return p;
  }
  draw();
}
A.BLOCKS.framework=(b,u)=>{const w=el('div');render(w,{current:u.number});return w};
A.VIEWS.framework={title:'Framework map (Table 1)',icon:'◈',
  render(page){page.appendChild(el('div','stage-h',`<span class="tag">Table 1</span><h2>${esc(F.title)}</h2>`));const w=el('div');page.appendChild(w);render(w,{current:A.state.unitNumber})}};
})();
