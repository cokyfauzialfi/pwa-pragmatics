// Compact ribbon menu: tabs only by default; a tab opens its one-row ribbon, which closes after a command.
// Double-click a tab (or use View > Keep the ribbon open) to keep it open. Themes: app light/dark/Windows, ribbon light/dark/match.
(function(){
'use strict';
const A=window.APP,{el,esc,C,store}=A;
const $=s=>document.querySelector(s);
const side=$('#side'),tabsEl=$('#rtabs'),body=$('#rbody'),curEl=$('#rcur');
const P={back:'<path d="M15 5l-7 7 7 7"/>',next:'<path d="M9 5l7 7-7 7"/>',
 framework:'<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 8l4 4-4 4-4-4z"/>',journal:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
 glossary:'<path d="M4 18l4-11 4 11M5.5 14h5"/><path d="M14 18l3-7 3 7M15 16h4"/>',
 pdf:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 14h6M9 17h4"/>',csv:'<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 10h16M4 15h16M10 5v14"/>',
 word:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M8.5 13l1.3 5 2.2-5 2.2 5 1.3-5"/>',
 about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4M12 17v.5"/>',
 developers:'<circle cx="9" cy="9" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="10" r="2.3"/><path d="M16 14.2c3 .2 5 2.2 5 5.3"/>',
 add:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 start:'<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',cont:'<circle cx="12" cy="12" r="9"/><path d="M10 8l5 4-5 4z"/>'};
const svg=(k,s=16)=>P[k]?`<svg class="ri" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`:'';
const TABS=[['home','Home'],['write','Write'],['export','Export'],['view','View'],['help','Help']];
let active='home',open=false;
const get=(k,d)=>store.get('settings/'+k)||d;
const pinned=()=>get('ribbonPinned','0')==='1';
const close=()=>{if(open&&!pinned()){open=false;render()}};

// Screen width on phones: lays the app out at 360, 390 or 430 px and scales it to fit the screen. Ignored on computers and in the desktop app.
const LW=[['auto','Auto'],['360','360'],['390','390'],['430','430']];
const isPhone=()=>Math.min(screen.width||9999,screen.height||9999)<=600;
function applyWidth(){
  if(window.appStore)return;
  const m=document.querySelector('meta[name=viewport]');if(!m)return;
  const w=get('layoutW','auto'),portrait=!window.matchMedia||matchMedia('(orientation:portrait)').matches;
  m.setAttribute('content',(w!=='auto'&&isPhone()&&portrait)?`width=${w}`:'width=device-width,initial-scale=1');
}
if(window.matchMedia){const mq=matchMedia('(orientation:portrait)');(mq.addEventListener?mq.addEventListener('change',()=>applyWidth()):mq.addListener&&mq.addListener(()=>applyWidth()))}
A.layoutWidth={opts:LW,get:()=>get('layoutW','auto'),set:v=>{store.set('settings/layoutW',v);applyWidth()},isPhone,deviceWidth:()=>screen.width};
function applySettings(){
  applyWidth();
  const t=get('theme','auto'),r=get('ribbonStyle','match'),root=document.documentElement;
  if(t==='auto')root.removeAttribute('data-theme');else root.setAttribute('data-theme',t);
  side.dataset.rstyle=r;side.classList.toggle('pinned',pinned());
  const z={normal:'1',large:'1.15',xl:'1.3'}[get('textSize','normal')]||'1';document.getElementById('main').style.zoom=z==='1'?'':z;
}
const btn=(label,icon,fn,o={})=>{const b=el('button','rbtn',(icon?svg(icon):'')+`<span>${esc(label)}</span>`);b.type='button';
  if(o.title)b.title=o.title;if(o.disabled)b.disabled=true;if(o.current)b.setAttribute('aria-current','true');
  b.onclick=()=>{fn();if(!o.keep)close()};return b};
const group=(...kids)=>{const g=el('div','rg');kids.forEach(k=>k&&g.appendChild(k));return g};
const lab=t=>el('span','rl',esc(t));
function seg(label,opts,val,set){
  const g=el('div','rg');g.appendChild(lab(label));const s=el('div','seg');s.setAttribute('role','group');s.setAttribute('aria-label',label);
  opts.forEach(([v,t])=>{const b=el('button',null,esc(t));b.type='button';b.setAttribute('aria-pressed',String(val===v));b.onclick=()=>{set(v);applySettings();render()};s.appendChild(b)});
  g.appendChild(s);return g;
}
function check(label,val,set){
  const l=el('label','rchk');const i=document.createElement('input');i.type='checkbox';i.checked=val;i.onchange=()=>{set(i.checked);applySettings()};
  l.appendChild(i);l.appendChild(el('span',null,esc(label)));return l;
}
const viewBtn=(k,o={})=>{const v=A.VIEWS[k];return v?btn(v.title.replace(' (Table 1)',''),k,()=>A.openView(k),{current:A.state.view===k,...o}):null};

const PANELS={
  home(){
    const nums=el('div','rg runits');nums.setAttribute('role','group');nums.setAttribute('aria-label','Units');
    for(let n=1;n<=9;n++){const u=C.units.find(x=>x.number===n);
      const pr=u?A.unitProgress(u):null;
      const b=el('button','runit'+(pr&&pr.state!=='none'?' '+pr.state:''),String(n));b.type='button';b.title=u?`Unit ${n} · ${u.title}`+(pr?` · ${pr.state==='none'?'not started':pr.state==='done'?'all stages opened':pr.seen+' of '+pr.total+' stages opened'}`:''):'Coming soon';b.setAttribute('aria-label',b.title);
      if(!u)b.disabled=true;else b.onclick=()=>{A.openUnit(u);close()};
      if(A.state.view==='unit'&&A.state.unitNumber===n)b.setAttribute('aria-current','true');nums.appendChild(b)}
    const si=A.stageInfo(),lp=A.lastPlace();
    return [group(viewBtn('start'),lp?btn('Continue','cont',()=>A.openUnit(lp.u,lp.s),{title:`Unit ${lp.u.number} · ${A.stageLabel(lp.u,lp.s)}`}):null),nums,
      group(btn('Previous stage','back',()=>A.stepStage(-1),{disabled:!si||si.idx<=-1,keep:true}),btn('Next stage','next',()=>A.stepStage(1),{disabled:!si||si.idx>=si.max,keep:true})),
      group(viewBtn('framework'),viewBtn('journal'),viewBtn('glossary'))];
  },
  write(){
    const sn=A.snippets;
    return [group(check('Writing starters',sn.starters.get(),sn.starters.set),check('Underline key terms',sn.terms.get(),sn.terms.set)),
      group(viewBtn('journal',{}),btn('New journal entry','add',()=>{A.openView('journal');setTimeout(()=>{const b=document.querySelector('#page .jtools button.pri');if(b)b.click()},30)})),
      group(viewBtn('glossary'),viewBtn('framework'))];
  },
  export(){
    const J=A.journalExport;
    return [group(btn('Export this page (PDF)','pdf',()=>$('#export').click(),{title:'Your work in the open unit, or the open journal, as a PDF'})),
      group(lab('Field Journal'),btn('CSV','csv',()=>J.csv(),{title:'A spreadsheet file (.csv) that opens in Excel'}),
        window.appStore?btn('Word','word',()=>J.docx(),{title:'An editable Word file (.docx)'}):btn('Word (desktop app only)','word',()=>{},{disabled:true,title:'Word export is available in the Windows desktop app. In the browser, use CSV or PDF.'}),
        btn('PDF','pdf',()=>J.pdf(),{title:'A PDF, printed on white, ready to hand in'}))];
  },
  view(){
    return [seg('App theme',[['auto',window.appStore?'Follow Windows':'Follow my device'],['light','Light'],['dark','Dark']],get('theme','auto'),v=>store.set('settings/theme',v)),
      seg('Ribbon',[['match','Match the app'],['light','Light'],['dark','Dark']],get('ribbonStyle','match'),v=>store.set('settings/ribbonStyle',v)),
      window.appStore?null:seg('Screen width (phones)',LW,get('layoutW','auto'),v=>store.set('settings/layoutW',v)),
      seg('Text size',[['normal','Normal'],['large','Large'],['xl','Larger']],get('textSize','normal'),v=>store.set('settings/textSize',v)),
      group(check('Keep the ribbon open',pinned(),on=>{store.set('settings/ribbonPinned',on?'1':'0');open=on||open;render()}))];
  },
  help(){return [group(viewBtn('help'),viewBtn('about'),viewBtn('developers'))]}
};

function curLabel(){
  if(A.state.view==='unit'){const u=C.units.find(x=>x.number===A.state.unitNumber);return u?`Unit ${u.number} · ${u.title}`:''}
  const v=A.VIEWS[A.state.view];return v?v.title:'';
}
function render(){
  const isOpen=open||pinned();
  tabsEl.innerHTML='';
  TABS.forEach(([k,t])=>{
    const b=el('button','rtab',esc(t));b.type='button';b.id='rtab-'+k;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(isOpen&&active===k));b.setAttribute('aria-controls','rbody');b.tabIndex=(isOpen?active===k:k==='home')?0:-1;
    b.onclick=()=>{if(pinned()){active=k;open=true}else if(open&&active===k)open=false;else{active=k;open=true}render()};
    b.ondblclick=()=>{const p=!pinned();store.set('settings/ribbonPinned',p?'1':'0');active=k;open=p;applySettings();render()};
    b.onkeydown=e=>{const i=TABS.findIndex(x=>x[0]===k);let j=null;
      if(e.key==='ArrowRight')j=(i+1)%TABS.length;else if(e.key==='ArrowLeft')j=(i+TABS.length-1)%TABS.length;
      if(j!=null){e.preventDefault();const n=$('#rtab-'+TABS[j][0]);if(n){n.focus();if(isOpen){active=TABS[j][0];render();$('#rtab-'+active).focus()}}}
      if(e.key==='ArrowDown'&&isOpen){const f=body.querySelector('button:not(:disabled),input');if(f){e.preventDefault();f.focus()}}};
    tabsEl.appendChild(b)});
  curEl.textContent=curLabel();
  body.setAttribute('aria-labelledby','rtab-'+active);
  if(isOpen){body.hidden=false;body.innerHTML='';PANELS[active]().forEach(n=>n&&body.appendChild(n))}else{body.hidden=true;body.innerHTML=''}
}
A.renderRibbon=render;
document.addEventListener('mousedown',e=>{if(open&&!pinned()&&!side.contains(e.target))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open&&!pinned()){open=false;render();const t=$('#rtab-'+active);if(t)t.focus()}});
const prev=A.onLoaded;A.onLoaded=function(){if(prev)prev();applySettings();if(pinned())open=true};
A.ribbon={setTheme:v=>{store.set('settings/theme',v);applySettings();render()},setRibbonStyle:v=>{store.set('settings/ribbonStyle',v);applySettings();render()},setPinned:on=>{store.set('settings/ribbonPinned',on?'1':'0');open=on;applySettings();render()}};
})();
