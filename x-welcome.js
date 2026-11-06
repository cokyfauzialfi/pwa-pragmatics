// Start here: the first screen. What the app is, how it works, where you stopped, and the nine units with progress.
(function(){
'use strict';
const A=window.APP,{el,esc,md,C}=A;
const desktop=!!window.appStore;

const STEPS=[
 ['Choose a unit','Pick one of the nine units below, or a number on the <b>Home</b> tab at the top.'],
 ['Read stage by stage','Each unit has stages. Use the tabs under the menu, or <b>Previous</b> and <b>Next</b> at the bottom of each page.'],
 ['Write in the boxes','Type your answers. They save by themselves '+(desktop?'on this computer':'in this browser on this device')+'.'],
 ['Keep a copy','Select <b>Export my work (PDF)</b> at the top right. Your Field Journal also exports to Word and CSV.']
];

function progressText(p){return p.state==='none'?'Not started':p.state==='done'?'All stages opened':`${p.seen} of ${p.total} stages opened`}

A.VIEWS.start={group:'info',title:'Start here',icon:'⌂',render(page){
  page.appendChild(el('div','stage-h','<span class="tag">Welcome</span><h2>Start here</h2>'));
  page.appendChild(el('p','lead',md('Nine short units on how meaning works in chats, comments and messages, and how to write with **adab** online. You read, write your own answers, and keep your own record, all in one place.')));

  // continue where you left off
  const last=A.lastPlace();
  const box=el('section','wl-continue');
  if(last){
    box.appendChild(el('div','wl-ck','Continue where you left off'));
    box.appendChild(el('div','wl-ct',`Unit ${last.u.number} · ${esc(last.u.title)}`));
    box.appendChild(el('div','wl-cs',esc(A.stageLabel(last.u,last.s))));
    const b=el('button','ghost pri','Continue');b.type='button';b.onclick=()=>A.openUnit(last.u,last.s);box.appendChild(b);
  }else{
    box.appendChild(el('div','wl-ck','New here?'));
    box.appendChild(el('div','wl-ct','Begin with Unit 1'));
    box.appendChild(el('div','wl-cs',esc(C.units[0].title)));
    const b=el('button','ghost pri','Start Unit 1');b.type='button';b.onclick=()=>A.openUnit(C.units[0]);box.appendChild(b);
  }
  page.appendChild(box);

  // screen width (web only)
  if(!desktop&&A.layoutWidth){
    const LW=A.layoutWidth,sec=el('section','wl-width');
    sec.appendChild(el('div','wl-ck','Screen width'));
    const row=el('div','seg wl-seg');row.setAttribute('role','group');row.setAttribute('aria-label','Screen width in pixels');
    const cur=LW.get();
    LW.opts.forEach(([v,t])=>{const b=el('button',null,esc(v==='auto'?'Auto':t+' px'));b.type='button';b.setAttribute('aria-pressed',String(cur===v));
      b.onclick=()=>{LW.set(v);row.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');note.textContent=msg(v)};row.appendChild(b)});
    const msg=v=>!LW.isPhone()?'This choice changes how the app fits a phone. On a computer screen it has no effect.':v==='auto'?`Auto uses your phone's own width (${LW.deviceWidth()} px). If the page feels cramped or too small, try 360, 390 or 430 px.`:`The app is laid out at ${v} px wide and scaled to fit your screen. A smaller number gives bigger text and buttons; a larger number fits more on screen.`;
    const note=el('p','wl-wn',esc(msg(cur)));
    sec.appendChild(row);sec.appendChild(note);page.appendChild(sec);
  }

  // how it works
  page.appendChild(el('h3',null,'How it works'));
  const ol=el('ol','wl-steps');
  STEPS.forEach(([t,d],i)=>ol.appendChild(el('li',null,`<span class="wl-n">${i+1}</span><div><b>${esc(t)}</b><span>${d}</span></div>`)));
  page.appendChild(ol);

  // the units
  page.appendChild(el('h3',null,'The nine units'));
  const grid=el('div','wl-units');
  C.units.forEach(u=>{
    const p=A.unitProgress(u);
    const c=el('button','wl-u wl-'+p.state);c.type='button';
    const pct=Math.round(100*p.seen/p.total);
    c.innerHTML=`<span class="wl-un">${u.number}</span><span class="wl-ut"><b>${esc(u.title)}</b><i>${esc(u.titleId.split(':')[0])}</i><span class="wl-pr"><span class="bar"><span style="width:${pct}%"></span></span><small>${p.state==='done'?'✓ ':''}${esc(progressText(p))}</small></span></span>`;
    c.setAttribute('aria-label',`Unit ${u.number}, ${u.title}. ${progressText(p)}.`);
    c.onclick=()=>A.openUnit(u);grid.appendChild(c);
  });
  page.appendChild(grid);

  // tools
  page.appendChild(el('h3',null,'Tools you can use anywhere'));
  const tools=el('div','wl-tools');
  [['journal','My Field Journal','Keep one real digital exchange each week, for the whole semester.'],
   ['glossary','Glossary','Every key term, with the unit that introduces it.'],
   ['framework','Framework map (Table 1)','See where each principle and pillar appears across the units.'],
   ['help','How to Use the App','Short answers, with a search box.']].forEach(([k,t,d])=>{
    const v=A.VIEWS[k];if(!v)return;
    const b=el('button','wl-t',`<b>${esc(t)}</b><span>${esc(d)}</span>`);b.type='button';b.onclick=()=>A.openView(k);tools.appendChild(b)});
  page.appendChild(tools);
}};
})();
