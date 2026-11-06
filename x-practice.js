// Unit 4 quiz ("Literal or implied?") and Unit 9 project tracker.
(function(){
'use strict';
const A=window.APP,{el,esc,md,store}=A;
const SK=A.sectionKey;

// ================= quiz =================
A.BLOCKS.quiz=(b,u)=>{
  const w=el('div','quiz');
  const key=(it,x)=>SK(u.id,b.id,it.id+(x?'/'+x:''));
  const choice=it=>store.get(key(it));
  const meaning=it=>store.get(key(it,'m'));
  const done=it=>{const c=choice(it);if(!c)return false;if(c!=='implied'||it.kind!=='implied')return true;return meaning(it)!==''};
  const right=it=>{const c=choice(it);if(c!==it.kind)return false;if(it.kind==='literal')return true;const m=meaning(it);return m!==''&&!!it.options[+m].ok};
  const head=el('div','q-head');w.appendChild(head);
  w.appendChild(el('p',null,md(b.intro||'')));
  const cards=[];
  function drawHead(){
    const d=b.items.filter(done).length,c=b.items.filter(it=>done(it)&&right(it)).length;
    head.innerHTML='';
    head.appendChild(el('div','q-prog',`<b>${esc(b.title||'Quiz')}</b> · answered ${d} of ${b.items.length}${d?` · correct ${c}`:''}`));
    const bar=el('div','bar');bar.appendChild(el('span',null,''));bar.firstChild.style.width=(100*d/b.items.length)+'%';head.appendChild(bar);
    if(d===b.items.length){head.appendChild(el('div','q-final',`You answered <b>${c} of ${b.items.length}</b> correctly. Read the clues given after each message: naming the clues matters more than the score. In real chats, readings can differ.`))}
    if(d){const r=el('button','ghost','Start again');r.type='button';r.onclick=()=>{b.items.forEach(it=>{store.set(key(it),'');store.set(key(it,'m'),'')});cards.forEach(f=>f());drawHead()};head.appendChild(r)}
  }
  b.items.forEach((it,n)=>{
    const card=el('section','q-card');w.appendChild(card);
    const draw=()=>{
      card.innerHTML='';
      card.appendChild(el('div','q-n',`Message ${n+1} of ${b.items.length}`));
      if(it.scene)card.appendChild(el('div','q-scene',md(it.scene)));
      const chat=el('div','chat');const body=el('div','chat-body');
      it.thread.forEach((m,i)=>{body.appendChild(el('div','bub '+m.side+(i===it.thread.length-1?' judge':''),`<div class="who">${esc(m.who)}</div>${esc(m.text)}<span class="gl">${esc(m.gloss||'')}</span>`))});
      chat.appendChild(body);card.appendChild(chat);
      card.appendChild(el('div','q-ask','Look at the <b>last message</b>. Is its meaning literal, or is something implied?'));
      const c=choice(it);
      const row=el('div','q-opts');
      [['literal','Literal'],['implied','Implied']].forEach(([v,t])=>{
        const bt=el('button','q-opt'+(c===v?' sel':''),t);bt.type='button';bt.disabled=!!c;bt.setAttribute('aria-pressed',String(c===v));
        bt.onclick=()=>{store.set(key(it),v);draw();drawHead()};row.appendChild(bt)});
      card.appendChild(row);
      if(c==='implied'&&it.kind==='implied'){
        card.appendChild(el('div','q-ask','What is most likely implied?'));
        const m=meaning(it);const ol=el('div','q-meaning');
        it.options.forEach((o,i)=>{const bt=el('button','q-opt wide'+(m===String(i)?' sel':'')+(m!==''&&o.ok?' ok':'')+(m===String(i)&&!o.ok?' no':''),esc(o.t));bt.type='button';bt.disabled=m!=='';
          bt.onclick=()=>{store.set(key(it,'m'),String(i));draw();drawHead()};ol.appendChild(bt)});
        card.appendChild(ol);
      }
      if(done(it)){
        const ok=right(it);let lead;
        if(ok)lead='Correct.';
        else if(c===it.kind)lead='Right that it is implied, but another meaning is more likely: “'+it.options.find(o=>o.ok).t+'”';
        else lead='Not quite. This one is '+it.kind+'.';
        const fb=el('div','q-fb '+(ok?'ok':'no'),`<b>${esc(lead)}</b> ${md(it.why)}`);
        const tr=el('button','ghost','Try this one again');tr.type='button';tr.onclick=()=>{store.set(key(it),'');store.set(key(it,'m'),'');draw();drawHead()};
        fb.appendChild(tr);card.appendChild(fb);
      }
    };
    cards.push(draw);draw();
  });
  drawHead();return w;
};
A.REPORT.quiz=(b,u,parts)=>{
  const key=(it,x)=>SK(u.id,b.id,it.id+(x?'/'+x:''));
  const t=el('table','rp-t');t.innerHTML='<thead><tr><th>Last message</th><th>My answer</th><th>Result</th></tr></thead>';
  const tb=el('tbody');let n=0,c=0;
  b.items.forEach(it=>{
    const ch=store.get(key(it));const m=store.get(key(it,'m'));
    const last=it.thread[it.thread.length-1];
    let ans='—',res='—';
    if(ch){ans=ch==='literal'?'Literal':'Implied'+(m!==''&&it.options?': '+it.options[+m].t:'');
      const fin=ch!=='implied'||it.kind!=='implied'||m!=='';
      if(fin){n++;const ok=ch===it.kind&&(it.kind==='literal'||it.options[+m].ok);if(ok)c++;res=ok?'Correct':'Not quite ('+it.kind+')'}else res='Unfinished'}
    const tr=el('tr');tr.appendChild(el('td',null,esc(last.text)+' <span class="gloss">('+esc(last.gloss||'')+')</span>'));tr.appendChild(el('td',null,esc(ans)));tr.appendChild(el('td',null,esc(res)));tb.appendChild(tr)});
  t.appendChild(tb);
  parts.push(el('div','rp-q',`<div class="rp-ql">${esc(b.title||'Quiz')}: ${c} of ${b.items.length} correct${n<b.items.length?' ('+n+' answered)':''}</div>`));parts.push(t);
};

// ================= project tracker =================
const STATUS=[['','Not started'],['doing','In progress'],['done','Done']];
const statusLabel=v=>(STATUS.find(s=>s[0]===v)||STATUS[0])[1];
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmtDate=s=>{if(!s)return '';const d=new Date(s+'T00:00:00');return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
A.BLOCKS.tracker=(b,u)=>{
  const w=el('div','trk');
  const k=(a,x)=>SK(u.id,b.id,a+(x?'.'+x:''));
  const top=el('div','trk-top');
  const g=el('div');g.appendChild(el('label',null,'Group members'));g.appendChild(A.field(k('members'),false));top.appendChild(g);
  const d=el('div');d.appendChild(el('label',null,'Showcase date'));
  const di=el('input','f');di.type='date';di.value=store.get(k('showcase'));di.oninput=()=>store.set(k('showcase'),di.value);d.appendChild(di);top.appendChild(d);
  w.appendChild(top);
  const prog=el('div','trk-prog');w.appendChild(prog);
  const reqId=b.id+'-req';
  const update=()=>{
    const done=b.steps.filter(s=>store.get(k(s.id,'status'))==='done').length;
    const doing=b.steps.filter(s=>store.get(k(s.id,'status'))==='doing').length;
    const rq=(b.requirements||[]).filter((_,i)=>store.get(SK(u.id,reqId,i))==='1').length;
    prog.innerHTML=`<div><b>${done} of ${b.steps.length}</b> steps done${doing?` · ${doing} in progress`:''} · <b>${rq} of ${(b.requirements||[]).length}</b> requirements ready</div>`;
    const bar=el('div','bar');bar.appendChild(el('span',null,''));bar.firstChild.style.width=(100*done/b.steps.length)+'%';prog.appendChild(bar);
    w.querySelectorAll('.trk-step').forEach(r=>{const id=r.dataset.id;const dt=store.get(k(id,'date'));const st=store.get(k(id,'status'));
      const late=!!dt&&dt<todayISO()&&st!=='done';r.classList.toggle('late',late);r.classList.toggle('is-done',st==='done');r.querySelector('.late-tag').hidden=!late})
  };
  w.appendChild(el('h3',null,'The eight steps'));
  const steps=el('div','trk-steps');
  b.steps.forEach((s,i)=>{
    const r=el('div','trk-step');r.dataset.id=s.id;
    r.appendChild(el('div','trk-t',`<span class="trk-n">${i+1}</span><div><b>${esc(s.title)}</b><div class="muted">${esc(s.desc||'')}</div></div>`));
    const c=el('div','trk-c');
    const sel=el('select','f');sel.setAttribute('aria-label',s.title+' status');STATUS.forEach(([v,t])=>{const o=el('option',null,esc(t));o.value=v;sel.appendChild(o)});sel.value=store.get(k(s.id,'status'));sel.onchange=()=>{store.set(k(s.id,'status'),sel.value);update()};
    const dt=el('input','f');dt.type='date';dt.setAttribute('aria-label',s.title+' target date');dt.value=store.get(k(s.id,'date'));dt.oninput=()=>{store.set(k(s.id,'date'),dt.value);update()};
    const lt=el('span','late-tag','Past target date');lt.hidden=true;
    c.appendChild(el('label','sm','Status'));c.appendChild(sel);c.appendChild(el('label','sm','Target date'));c.appendChild(dt);c.appendChild(lt);
    r.appendChild(c);
    const nt=A.field(k(s.id,'note'),false);nt.placeholder='Notes: who does what, what is left';nt.setAttribute('aria-label',s.title+' notes');r.appendChild(nt);
    steps.appendChild(r)});
  w.appendChild(steps);
  if((b.requirements||[]).length){
    w.appendChild(el('h3',null,'The five requirements'));
    const cl=A.checklist(u,{id:reqId,items:b.requirements});
    cl.addEventListener('change',update);w.appendChild(cl);
  }
  update();return w;
};
A.REPORT.tracker=(b,u,parts)=>{
  const k=(a,x)=>SK(u.id,b.id,a+(x?'.'+x:''));
  const mem=store.get(k('members')),sh=store.get(k('showcase'));
  parts.push(el('div','rp-q',`<div class="rp-ql">Group members</div>${mem?'<span class="rp-a">'+esc(mem)+'</span>':'<span class="rp-e">—</span>'}`));
  parts.push(el('div','rp-q',`<div class="rp-ql">Showcase date</div>${sh?'<span class="rp-a">'+esc(fmtDate(sh))+'</span>':'<span class="rp-e">—</span>'}`));
  const t=el('table','rp-t');t.innerHTML='<thead><tr><th>Step</th><th>Status</th><th>Target date</th><th>Notes</th></tr></thead>';
  const tb=el('tbody');
  b.steps.forEach((s,i)=>{const tr=el('tr');
    tr.appendChild(el('td','key',`${i+1} · ${esc(s.title)}`));tr.appendChild(el('td',null,esc(statusLabel(store.get(k(s.id,'status'))))));
    const dt=store.get(k(s.id,'date'));tr.appendChild(el('td',null,dt?esc(fmtDate(dt)):'<span class="rp-e">—</span>'));
    const nt=store.get(k(s.id,'note'));tr.appendChild(el('td',null,nt?esc(nt):'<span class="rp-e">—</span>'));tb.appendChild(tr)});
  t.appendChild(tb);parts.push(t);
  const reqId=b.id+'-req';
  if((b.requirements||[]).length){const q=el('div','rp-q');q.innerHTML='<div class="rp-ql">The five requirements</div>'+b.requirements.map((x,i)=>`<div class="rp-c">${store.get(SK(u.id,reqId,i))==='1'?'☑':'☐'} ${md(x)}</div>`).join('');parts.push(q)}
};
})();
