// Field Journal: entries kept across the whole semester, per-unit forms, full journal view, CSV / Word / PDF export.
(function(){
'use strict';
const A=window.APP,{el,esc,md,store,C}=A;
const KEY='journal/entries';
const DEF={ex:'Exchange',said:'What was said',meant:'What I think was meant',focus:'Unit focus'};
const FIELDS=['ex','said','meant','focus'];
const PLATFORMS=['WhatsApp','Telegram','Email','Instagram','TikTok','X','Facebook','Class forum / LMS','Video-call chat','Other'];
const unitBy=n=>C.units.find(u=>u.number===n);
function jBlock(n){const u=unitBy(n);if(!u)return null;for(const s of u.stages)for(const b of s.blocks)if(b.type==='journal')return b;return null}
const labelsFor=n=>Object.assign({},DEF,(jBlock(n)||{}).labels||{});
const unitName=n=>{const u=unitBy(n);return u?`Unit ${u.number} · ${u.title}`:'General (not tied to a unit)'};
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const fmtDate=s=>{const d=new Date(s+'T00:00:00');return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
const uid=()=>'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const all=()=>store.getJSON(KEY,[]);
const put=l=>store.setJSON(KEY,l);
const byNew=(a,b)=>(b.date||'').localeCompare(a.date||'')||(b.time||'').localeCompare(a.time||'')||(b.created||'').localeCompare(a.created||'');
const byOld=(a,b)=>-byNew(a,b);
const when=e=>fmtDate(e.date)+(e.time?' · '+e.time:'');

// ---- anonymization check: light, never blocks ----
const TITLE=/\b(?:[Pp]ak|[Bb]apak|[Bb]u|[Ii]bu|[Mm]as|[Mm]bak|[Kk]ak|[Kk]ang|[Tt]eh|[Bb]ang|[Dd]r|[Pp]rof|[Uu]staz|[Uu]stadz|[Uu]stadzah|[Hh]aji|[Hh]ajjah|Mr|Ms|Mrs)\.?\s+[A-Z][a-z]{2,}/;
function textFlags(t){
  const f=[];t=String(t||'');
  if(/[\w.+-]+@[\w-]+(\.[\w-]+)+/.test(t))f.push('an email address');
  if(/(^|[^\w])@[A-Za-z0-9_.]{3,}/.test(t))f.push('a @handle');
  const ph=t.match(/\+?\d[\d\s().-]{6,}\d/g)||[];
  if(ph.some(m=>m.replace(/\D/g,'').length>=9&&!/^\d{4}-\d{2}-\d{2}$/.test(m.trim())))f.push('a phone number');
  if(/\bhttps?:\/\/\S+|\bwww\.\S+/i.test(t))f.push('a web link');
  if(TITLE.test(t))f.push('a name after a title (such as “Pak …”, “Bu …”, “Dr. …”)');
  return f;
}
function flagsOf(e){const out=[];const L=labelsFor(e.unit);FIELDS.concat('platform').forEach(k=>textFlags(e[k]).forEach(w=>out.push(`${k==='platform'?'Platform':L[k]}: ${w}`)));return out}

// ---- a filled-in sample, per unit, so the columns are clear before writing (content: the journal block's "example") ----
function drawExample(box,n,L){
  const b=jBlock(n)||jBlock(1),ex=b&&b.example;
  if(!ex){box.hidden=true;return}
  const open=box.open;box.hidden=false;box.innerHTML='';
  box.appendChild(el('summary',null,'See an example entry'));
  const rows=[['Time (24-hour, optional)',ex.time],['Platform',ex.platform]].concat(FIELDS.map(k=>[L[k],ex[k]])).filter(r=>r[1]);
  const t=el('dl','jex-b');rows.forEach(r=>{t.appendChild(el('dt',null,esc(r[0])));t.appendChild(el('dd',null,esc(r[1])))});
  box.appendChild(t);
  box.appendChild(el('p','jex-n','This is only a guide, written for '+(n?'this unit':'Unit 1')+'. Write your own entry, and anonymize it: roles such as “Lecturer A”, no names or numbers.'));
  box.open=open;
}

// ---- one entry form (used in units and in the full journal) ----
function entryForm(o){
  const f=el('form','jform');f.noValidate=true;
  const dk=o.draftKey;
  const v=Object.assign({date:today(),time:'',unit:o.unit||0,platform:'',ex:'',said:'',meant:'',focus:''},(!o.entry&&dk)?store.getJSON(dk,{}):{},o.entry||{});
  v.unit=Number(v.unit)||0;
  const ctl={};
  const row=(label,node,cls)=>{const d=el('div','jr '+(cls||''));const l=el('label',null,'');l.textContent=label;const id='jf'+Math.random().toString(36).slice(2,8);node.id=id;l.htmlFor=id;d.appendChild(l);d.appendChild(node);return {d,l}};
  const meta=el('div','jmeta');
  const date=el('input','f');date.type='date';date.value=v.date;ctl.date=date;
  const time=el('input','f');time.type='text';time.placeholder='HH:MM';time.maxLength=5;time.value=v.time||'';time.setAttribute('inputmode','numeric');ctl.time=time;
  const unit=el('select','f');[0,...C.units.map(u=>u.number)].forEach(n=>{const op=el('option',null,esc(unitName(n)));op.value=n;unit.appendChild(op)});unit.value=v.unit;ctl.unit=unit;
  const plat=el('input','f');plat.type='text';plat.setAttribute('list','plats');plat.value=v.platform||'';plat.placeholder='e.g. WhatsApp';ctl.platform=plat;
  [['Date',date],['Time (24-hour, optional)',time],['Unit',unit],['Platform',plat]].forEach(([l,n])=>{const r=row(l,n);if(l==='Unit'&&o.unit)unit.disabled=true;meta.appendChild(r.d)});
  f.appendChild(meta);
  if(!document.getElementById('plats')){const dl=document.createElement('datalist');dl.id='plats';PLATFORMS.forEach(p=>{const op=document.createElement('option');op.value=p;dl.appendChild(op)});document.body.appendChild(dl)}
  const hint=el('div','jhint');f.appendChild(hint);
  const exBox=el('details','jex');if(!o.entry)f.appendChild(exBox);
  const labs={};
  FIELDS.forEach(k=>{const t=el('textarea','f');t.rows=k==='focus'?4:3;t.value=v[k]||'';ctl[k]=t;const r=row(DEF[k],t);labs[k]=r.l;f.appendChild(r.d)});
  const upd=()=>{const n=Number(unit.value)||0;const L=labelsFor(n);FIELDS.forEach(k=>labs[k].textContent=L[k]);const b=jBlock(n);hint.innerHTML=b&&b.unitFocus?'<b>Unit focus:</b> '+md(b.unitFocus):'';drawExample(exBox,n,L)};
  upd();
  f.appendChild(el('div','anon','Retype and anonymize. Use roles or initials (for example “Lecturer A”) instead of names, and leave out phone numbers, handles, photographs and screenshots.'));
  const msg=el('div','jmsg');msg.setAttribute('role','alert');f.appendChild(msg);
  const warn=el('div','jwarn');warn.hidden=true;f.appendChild(warn);
  const btns=el('div','jbtns');
  const sb=el('button','ghost pri','Save entry');sb.type='submit';btns.appendChild(sb);
  if(o.onCancel){const cb=el('button','ghost','Cancel');cb.type='button';cb.onclick=o.onCancel;btns.appendChild(cb)}
  f.appendChild(btns);
  const collect=()=>({date:date.value||today(),time:time.value.trim(),unit:Number(unit.value)||0,platform:plat.value.trim(),ex:ctl.ex.value.trim(),said:ctl.said.value.trim(),meant:ctl.meant.value.trim(),focus:ctl.focus.value.trim()});
  const draft=()=>{if(dk&&!o.entry)store.setJSON(dk,collect())};
  f.addEventListener('input',()=>{msg.textContent='';warn.hidden=true;draft()});
  unit.addEventListener('change',()=>{upd();draft()});
  function commit(d){
    const list=all();let saved;
    if(o.entry){const i=list.findIndex(x=>x.id===o.entry.id);saved=Object.assign({},o.entry,d,{edited:new Date().toISOString()});if(i>=0)list[i]=saved;else list.push(saved)}
    else{saved=Object.assign({id:uid(),created:new Date().toISOString()},d);list.push(saved)}
    put(list);if(dk&&!o.entry)store.setJSON(dk,{});
    if(o.onSaved)o.onSaved(saved);
  }
  f.addEventListener('submit',e=>{
    e.preventDefault();const d=collect();
    if(!FIELDS.some(k=>d[k])){msg.textContent='Write something in at least one of the four boxes first.';return}
    if(d.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)){msg.textContent='Write the time in 24-hour format, for example 14:30, or leave it empty.';return}
    const fl=flagsOf(d);
    if(fl.length&&warn.hidden){
      warn.hidden=false;warn.innerHTML='<b>Check before saving.</b> This entry may contain details that could identify someone:<ul class="l">'+fl.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p>Replace names with roles or initials, and numbers or handles with a word such as “number” or “handle”. This check cannot catch everything, so read your entry once more.</p>';
      const b=el('div','jbtns');const a=el('button','ghost','Go back and edit');a.type='button';a.onclick=()=>{warn.hidden=true};
      const s=el('button','ghost','Save anyway');s.type='button';s.onclick=()=>commit(collect());b.appendChild(a);b.appendChild(s);warn.appendChild(b);
      warn.scrollIntoView({block:'nearest'});return}
    commit(d);
  });
  return f;
}

// ---- entry card ----
function entryCard(e,o){
  const card=el('article','jcard');card.dataset.id=e.id;
  function show(){
    card.innerHTML='';const L=labelsFor(e.unit);
    const fl=flagsOf(e);
    card.appendChild(el('header','jc-h',`<span class="jc-d">${esc(when(e))}</span><span class="jc-u">${esc(unitName(e.unit))}</span>${e.platform?`<span class="jc-p">${esc(e.platform)}</span>`:''}${fl.length?`<span class="jc-w" title="${esc(fl.join('; '))}">⚠ check for identifying details</span>`:''}`));
    FIELDS.forEach(k=>{if(e[k])card.appendChild(el('div','jc-f',`<div class="jc-l">${esc(L[k])}</div><div class="jc-t">${esc(e[k])}</div>`))});
    const bt=el('div','jbtns');
    const ed=el('button','ghost','Edit');ed.type='button';ed.onclick=()=>{card.innerHTML='';card.appendChild(entryForm({entry:e,onSaved:s=>{Object.assign(e,s);show();if(o.onChange)o.onChange()},onCancel:show}))};
    const del=el('button','ghost','Delete');del.type='button';
    del.onclick=()=>{bt.innerHTML='<span class="jconfirm">Delete this entry?</span>';
      const y=el('button','ghost danger','Yes, delete');y.type='button';y.onclick=()=>{put(all().filter(x=>x.id!==e.id));if(o.onChange)o.onChange()};
      const n=el('button','ghost','Keep it');n.type='button';n.onclick=show;bt.appendChild(y);bt.appendChild(n)};
    bt.appendChild(ed);bt.appendChild(del);card.appendChild(bt);
  }
  show();return card;
}

// ---- journal block inside a unit ----
A.BLOCKS.journal=(b,u)=>{
  const w=el('div','jwrap');
  let note='';
  function draw(){
    w.innerHTML='';
    w.appendChild(entryForm({unit:u.number,draftKey:'journal/draft/u'+u.number,onSaved:()=>{note='Entry saved to your Field Journal.';draw()}}));
    if(note){w.appendChild(el('div','jsaved',esc(note)))}
    const mine=all().filter(e=>e.unit===u.number).sort(byNew);
    const h=el('div','jlist-h',`<b>Your entries for this unit</b> <span class="muted">(${mine.length})</span>`);
    const open=el('button','ghost','Open my full Field Journal');open.type='button';open.onclick=()=>A.openView('journal');h.appendChild(open);w.appendChild(h);
    if(!mine.length)w.appendChild(el('p','muted','No entry for this unit yet.'));
    mine.forEach(e=>w.appendChild(entryCard(e,{onChange:draw})));
  }
  draw();return w;
};

// ---- exports ----
function csvText(list){
  const name=(store.get('profile/name')||'').trim();
  const H=(name?['Name']:[]).concat(['Date','Time','Unit','Platform','Exchange','What was said','What I think was meant','Unit focus']);
  // cells that start like a formula are prefixed so spreadsheets show them as text
  const q=s=>{s=String(s==null?'':s);if(/^([=+@\t\r]|-\S)/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const rows=list.map(e=>(name?[name]:[]).concat([e.date,e.time||'',unitName(e.unit),e.platform||'',e.ex,e.said,e.meant,e.focus]));
  return '﻿'+[H].concat(rows).map(r=>r.map(q).join(',')).join('\r\n')+'\r\n';
}
function docxPayload(list){
  const name=(store.get('profile/name')||'').trim();
  return {title:'My Field Journal',module:'Pragmatics for Adab-Based Digital Communication',name,exported:fmtDate(today()),
    entries:list.map(e=>{const L=labelsFor(e.unit);return {heading:when(e),meta:[unitName(e.unit),e.platform].filter(Boolean).join(' · '),rows:FIELDS.filter(k=>e[k]).map(k=>[L[k],e[k]])}})};
}
function download(name,text,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const say=t=>{const s=document.getElementById('saved');if(s)s.textContent=t};
async function exportCsv(list){
  const text=csvText(list);const fname='My Field Journal.csv';
  try{if(window.appStore&&window.appStore.exportFile){const r=await window.appStore.exportFile(fname,text);say(r&&r.saved?'CSV saved':'Export cancelled')}else{download(fname,text,'text/csv;charset=utf-8');say('CSV downloaded')}}catch(e){say('Could not export CSV')}
}
async function exportDocx(list){
  const fname='My Field Journal.docx';
  try{if(window.appStore&&window.appStore.exportJournalDocx){const r=await window.appStore.exportJournalDocx(fname,docxPayload(list));say(r&&r.saved?'Word file saved':'Export cancelled')}else say('Word export is available in the desktop app.')}catch(e){say('Could not export Word file')}
}
function reportInto(R,list,heading){
  R.innerHTML='';
  const name=(store.get('profile/name')||'').trim();
  R.appendChild(el('div','rp-head',`<div class="rp-k">Pragmatics for Adab-Based Digital Communication · Field Journal</div><h1>${esc(heading)}</h1><div class="rp-meta">${name?'<b>'+esc(name)+'</b> · ':''}${esc(fmtDate(today()))} · ${list.length} ${list.length===1?'entry':'entries'}</div>`));
  if(!list.length)R.appendChild(el('p','rp-e','No entries yet.'));
  list.forEach(e=>R.appendChild(entryReport(e)));
}
function entryReport(e){
  const L=labelsFor(e.unit);const s=el('section','rp-s');
  s.appendChild(el('h2',null,`<span>${esc(when(e))}</span> ${esc([unitName(e.unit),e.platform].filter(Boolean).join(' · '))}`));
  const t=el('table','rp-t');const tb=el('tbody');
  FIELDS.forEach(k=>{if(e[k]){const tr=el('tr');tr.appendChild(el('td','key',esc(L[k])));tr.appendChild(el('td',null,esc(e[k])));tb.appendChild(tr)}});
  t.appendChild(tb);s.appendChild(t);return s;
}
// PDF section of a unit's own export
A.REPORT.journal=(b,u,parts)=>{
  const mine=all().filter(e=>e.unit===u.number).sort(byOld);
  if(!mine.length){parts.push(el('div','rp-q','<div class="rp-ql">Field Journal entries for this unit</div><span class="rp-e">—</span>'));return}
  mine.forEach(e=>parts.push(entryReport(e)));
};

// ---- exports available from the ribbon ----
A.journalExport={csv:()=>exportCsv(all().slice().sort(byOld)),docx:()=>exportDocx(all().slice().sort(byOld)),
  pdf(){reportInto(document.getElementById('report'),all().slice().sort(byOld),'My Field Journal');return A.printReport('My Field Journal.pdf')}};

// ---- full journal view ----
A.VIEWS.journal={title:'My Field Journal',icon:'✎',reportName:'My Field Journal.pdf',
  _list:[],
  buildReport(){reportInto(document.getElementById('report'),this._list.slice().sort(byOld),'My Field Journal')},
  render(page){
    const self=this;let flt='all',q='',adding=false;
    page.appendChild(el('div','stage-h','<span class="tag">All units</span><h2>My Field Journal</h2>'));
    page.appendChild(el('p',null,'One journal for the whole semester. Entries from every unit are kept here, on this computer, and you can export them at any time.'));
    const tools=el('div','jtools');
    const sel=el('select','f');sel.setAttribute('aria-label','Filter by unit');
    [['all','All entries'],['0','General (not tied to a unit)']].concat(C.units.map(u=>[String(u.number),unitName(u.number)])).forEach(([v,t])=>{const o=el('option',null,esc(t));o.value=v;sel.appendChild(o)});
    const se=el('input','f');se.type='search';se.placeholder='Search entries';se.setAttribute('aria-label','Search entries');
    const nb=el('button','ghost pri','New entry');nb.type='button';
    tools.appendChild(sel);tools.appendChild(se);tools.appendChild(nb);page.appendChild(tools);
    const ex=el('div','jtools jexp');const cnt=el('span','muted');ex.appendChild(cnt);
    const mkb=(t,fn)=>{const b=el('button','ghost',t);b.type='button';b.onclick=()=>fn(self._list.slice().sort(byOld));ex.appendChild(b)};
    mkb('Export CSV',exportCsv);mkb('Export Word (.docx)',exportDocx);
    const pb=el('button','ghost','Export PDF');pb.type='button';pb.onclick=()=>{self.buildReport();A.printReport(self.reportName)};ex.appendChild(pb);
    page.appendChild(ex);
    const formBox=el('div');page.appendChild(formBox);
    const list=el('div','jlist');page.appendChild(list);
    function drawForm(){
      formBox.innerHTML='';if(!adding)return;
      formBox.appendChild(entryForm({unit:0,draftKey:'journal/draft/new',onSaved:()=>{adding=false;drawForm();drawList()},onCancel:()=>{adding=false;drawForm()}}));
      formBox.querySelector('select').disabled=false;
    }
    function drawList(){
      const ql=q.toLowerCase();
      let l=all();
      if(flt!=='all')l=l.filter(e=>String(e.unit)===flt);
      if(ql)l=l.filter(e=>[e.platform,e.ex,e.said,e.meant,e.focus,unitName(e.unit)].join(' ').toLowerCase().includes(ql));
      self._list=l;l=l.slice().sort(byNew);
      cnt.textContent=`Exports the ${l.length} ${l.length===1?'entry':'entries'} shown`;
      list.innerHTML='';
      if(!l.length)list.appendChild(el('p','muted',all().length?'No entry matches this filter.':'No entries yet. Select “New entry” to write your first one.'));
      l.forEach(e=>list.appendChild(entryCard(e,{onChange:drawList})));
    }
    sel.onchange=()=>{flt=sel.value;drawList()};se.oninput=()=>{q=se.value;drawList()};
    nb.onclick=()=>{adding=!adding;drawForm();if(adding)formBox.scrollIntoView({block:'nearest'})};
    drawForm();drawList();
  }};

// ---- move answers typed into the earlier four-box journal (v0.4) into dated entries, once ----
A.onLoaded=function(){
  const done=store.getJSON('journal/migrated',{});let list=null,dirty=false;
  C.units.forEach(u=>{
    if(done[u.id])return;
    const v={};let any=false;FIELDS.forEach(k=>{const x=store.get(`${u.id}/journal/${k}`);v[k]=x;if(x&&x.trim())any=true});
    done[u.id]=1;dirty=true;
    if(!any)return;list=list||all();
    list.push(Object.assign({id:uid(),created:new Date().toISOString(),date:today(),time:'',unit:u.number,platform:''},v));
    FIELDS.forEach(k=>store.set(`${u.id}/journal/${k}`,''));
  });
  if(list)put(list);
  if(dirty)store.setJSON('journal/migrated',done);
};
})();
