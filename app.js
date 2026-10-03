import {TYPES,emptyState,addNode,children,branch,canConnect,connect,disconnect,serialize,restore} from './model.js';
const $=s=>document.querySelector(s), storageKey='json-drop:v1';
let state=emptyState(), selected=null, gesture=null, storageIssue='';
try { const raw=localStorage.getItem(storageKey); if(raw) state=restore(raw); } catch { storageIssue='Salvataggio non leggibile: usa Nuovo per ripartire. Il dato originale è conservato.'; }
const colors={object:'#99f0cd',list:'#b5a2f5',text:'#f0ce8c',number:'#91c9ff',boolean:'#f2a8c6'};
function status(message) { $('#status').textContent=message; }
function save() { if(storageIssue) return; try { localStorage.setItem(storageKey,JSON.stringify(state)); } catch { status('Salvataggio non disponibile in questo browser. Copia il JSON prima di uscire.'); } }
function changed() { $('#json-output').value=JSON.stringify(serialize(state),null,2); save(); }
function position() {
  const v=state.view; $('#world').style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`;
  for(const n of state.nodes) { const el=document.getElementById(n.id); if(el) el.style.transform=`translate(${n.x}px,${n.y}px)`; }
  const paths=[];
  for(const n of state.nodes.filter(n=>n.parent)) {
    const p=state.nodes.find(p=>p.id===n.parent), el=document.getElementById(p.id);
    const x=p.x+112,y=p.y+el.offsetHeight,tx=n.x+112,ty=n.y;
    paths.push(`<path d="M${x},${y} C${x},${y+35} ${tx},${ty-35} ${tx},${ty}"/>`);
  }
  $('#wires').innerHTML=paths.join('');
}
function button(label,cls,action) { const b=document.createElement('button'); b.textContent=label;b.className=cls;b.onclick=action;return b; }
function render() {
  $('#nodes').replaceChildren(); $('#empty').hidden=state.nodes.length>0;
  for(const n of state.nodes) {
    const el=document.createElement('article');el.className='node';el.id=n.id;el.dataset.type=n.type;el.style.setProperty('--accent',colors[n.type]);el.setAttribute('aria-label',`${TYPES[n.type]} ${n.key}`);
    const h=button(`${TYPES[n.type]}  ·  ⠿`,'handle',()=>{});h.setAttribute('aria-label',`Sposta ${n.key}`);h.onpointerdown=e=>start(e,'move',n.id);h.onkeydown=e=>{ if(!e.key.startsWith('Arrow'))return;e.preventDefault();moveBranch(n.id,e.key==='ArrowRight'?16:e.key==='ArrowLeft'?-16:0,e.key==='ArrowDown'?16:e.key==='ArrowUp'?-16:0);position();save(); };el.append(h);
    const key=document.createElement('input');key.className='key';key.value=n.key;key.setAttribute('aria-label','Nome');key.autocomplete='off';
    key.oninput=()=>{ const duplicate=children(state,n.parent).some(v=>v.id!==n.id&&v.key===key.value)&&state.nodes.find(v=>v.id===n.parent)?.type!=='list';key.setAttribute('aria-invalid',String(duplicate));if(duplicate){status('Questo nome esiste già: scegli un nome diverso.');return;}n.key=key.value;changed(); };key.onblur=()=>{key.value=n.key;key.removeAttribute('aria-invalid');};el.append(key);
    if(n.type==='text'||n.type==='number') { const input=document.createElement('input');input.className='value';input.value=n.value;input.setAttribute('aria-label','Valore');input.placeholder=n.type==='text'?'Scrivi un valore…':'0';if(n.type==='number'){input.type='number';input.step='any';input.inputMode='decimal';}input.oninput=()=>{const value=n.type==='number'?Number(input.value):input.value;const valid=n.type!=='number'||input.value.trim()!==''&&Number.isFinite(value);input.setAttribute('aria-invalid',String(!valid));if(valid){n.value=value;changed();}else status('Inserisci un numero valido. Il valore precedente è conservato.');};input.onblur=()=>{input.value=n.value;input.removeAttribute('aria-invalid');};el.append(input); }
    if(n.type==='boolean') {const b=button(n.value?'Sì · true':'No · false','value-toggle',()=>{n.value=!n.value;b.textContent=n.value?'Sì · true':'No · false';b.setAttribute('aria-pressed',String(n.value));changed();});b.setAttribute('aria-label','Valore booleano');b.setAttribute('aria-pressed',String(n.value));el.append(b);}
    const actions=document.createElement('div');actions.className='actions';const link=button('↗ Collega','connect',()=>select(n.id));link.onpointerdown=e=>start(e,'connect',n.id);actions.append(link);
    if(n.parent) actions.append(button('Scollega','disconnect',()=>{disconnect(state,n.id);selected=null;render();changed();status('Nodo scollegato.');}));
    const parent=state.nodes.find(v=>v.id===n.parent);if(parent?.type==='list'){const b=button('↑','reorder',()=>{const siblings=children(state,n.parent),previous=siblings[siblings.indexOf(n)-1];if(previous){const a=state.nodes.indexOf(n),b=state.nodes.indexOf(previous);[state.nodes[a],state.nodes[b]]=[state.nodes[b],state.nodes[a]];layout(parent.id);render();changed();}});b.setAttribute('aria-label','Sposta prima nella lista');b.disabled=children(state,n.parent)[0]===n;actions.append(b);}
    actions.append(button('×','delete',()=>{if(!confirm('Eliminare questo nodo e tutto il suo ramo?'))return;const ids=branch(state,n.id);state.nodes=state.nodes.filter(v=>!ids.includes(v.id));selected=null;render();changed();}));actions.lastChild.setAttribute('aria-label','Elimina ramo');el.append(actions);
    if(['object','list'].includes(n.type)){const socket=button(n.type==='list'?'⊕ Aggiungi elemento':'⊕ Aggancia qui','socket',()=>{if(selected)attach(selected,n.id);else status('Premi Collega su un nodo, poi tocca questo aggancio.');});socket.dataset.id=n.id;socket.setAttribute('aria-label',`Aggancia a ${n.key}`);el.append(socket);}
    $('#nodes').append(el);
  }
  position();select(selected,false);
}
function select(id,announce=true) { selected=id;document.querySelectorAll('.node').forEach(el=>el.classList.toggle('selected',el.id===id));if(id&&announce) status('Trascina Collega su un aggancio, oppure tocca l’aggancio.'); }
function moveBranch(id,dx,dy) {const ids=new Set(branch(state,id));for(const n of state.nodes)if(ids.has(n.id)){n.x+=dx;n.y+=dy;}}
function layout(id) {const p=state.nodes.find(n=>n.id===id);let y=p.y+(document.getElementById(id)?.offsetHeight||180)+42;for(const n of children(state,id)){moveBranch(n.id,p.x+24-n.x,y-n.y);layout(n.id);y=Math.max(...branch(state,n.id).map(id=>{const c=state.nodes.find(n=>n.id===id);return c.y+(document.getElementById(id)?.offsetHeight||180);}))+38;}}
function attach(id,parent) {if(!connect(state,id,parent)){status('Aggancio impossibile: evita collegamenti circolari.');return;}selected=null;layout(parent);render();changed();status('Agganciato ✓');}
function point(e) {return {x:(e.clientX-state.view.x)/state.view.scale,y:(e.clientY-state.view.y)/state.view.scale};}
function targetAt(e,id) {let best=null,dist=Infinity;for(const el of document.querySelectorAll('.socket')){if(!canConnect(state,id,el.dataset.id))continue;const r=el.getBoundingClientRect();const dx=Math.max(r.left-e.clientX,0,e.clientX-r.right),dy=Math.max(r.top-e.clientY,0,e.clientY-r.bottom),d=Math.hypot(dx,dy);if(d<28&&d<dist){best=el;dist=d;}}return best;}
function start(e,mode,id=null) {
  if(gesture||!e.isPrimary||e.button!==0)return;if(mode==='pan'&&e.target.closest('.node'))return;
  if(mode!=='pan')e.stopPropagation();document.activeElement?.blur();
  gesture={mode,id,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,last:point(e),original:state.nodes.map(n=>({id:n.id,x:n.x,y:n.y})),view:{...state.view},moved:false,target:null};
  e.currentTarget.setPointerCapture(e.pointerId);if(mode==='connect')select(id);if(id)document.getElementById(id).classList.add('moving');
}
$('#canvas').onpointerdown=e=>{if(!e.target.closest('.node')){select(null);$('#palette').hidden=true;$('#add').setAttribute('aria-expanded','false');start(e,'pan');}};
window.addEventListener('pointermove',e=>{
  const g=gesture;if(!g||e.pointerId!==g.pointer)return;e.preventDefault();if(Math.hypot(e.clientX-g.startX,e.clientY-g.startY)>5)g.moved=true;if(!g.moved)return;
  if(g.mode==='pan'){state.view.x=g.view.x+e.clientX-g.startX;state.view.y=g.view.y+e.clientY-g.startY;}else{const p=point(e);moveBranch(g.id,p.x-g.last.x,p.y-g.last.y);g.last=p;if(g.mode==='connect'){g.target=targetAt(e,g.id);document.querySelectorAll('.socket').forEach(el=>el.classList.toggle('target',el===g.target));}}
  position();
},{passive:false});
function finish(e,cancel=false){const g=gesture;if(!g||e.pointerId!==g.pointer)return;gesture=null;document.querySelectorAll('.target,.moving').forEach(el=>el.classList.remove('target','moving'));if(cancel){for(const old of g.original){const n=state.nodes.find(n=>n.id===old.id);n.x=old.x;n.y=old.y;}state.view=g.view;select(null);position();return;}if(g.mode==='connect'&&g.moved&&g.target)attach(g.id,g.target.dataset.id);else{position();save();}if(g.moved){const suppress=e=>{e.preventDefault();e.stopPropagation();};window.addEventListener('click',suppress,{capture:true,once:true});setTimeout(()=>window.removeEventListener('click',suppress,true),0);}}
window.addEventListener('pointerup',e=>finish(e));window.addEventListener('pointercancel',e=>finish(e,true));window.addEventListener('lostpointercapture',e=>finish(e,true));
$('#add').onclick=()=>{const open=$('#palette').hidden;$('#palette').hidden=!open;$('#add').setAttribute('aria-expanded',String(open));};
$('#palette').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;const v=state.view,offset=state.nodes.length%4*22;const n=addNode(state,b.dataset.type,(innerWidth/2-112-v.x)/v.scale+offset,(140-v.y)/v.scale+offset);$('#palette').hidden=true;$('#add').setAttribute('aria-expanded','false');render();changed();document.getElementById(n.id).querySelector('.key').focus();document.getElementById(n.id).querySelector('.key').select();};
function zoom(factor){const v=state.view,next=Math.min(1.5,Math.max(.25,v.scale*factor)),cx=innerWidth/2,cy=innerHeight/2;v.x=cx-(cx-v.x)*next/v.scale;v.y=cy-(cy-v.y)*next/v.scale;v.scale=next;position();save();}
$('#zoom-in').onclick=()=>zoom(1.2);$('#zoom-out').onclick=()=>zoom(1/1.2);
$('#fit').onclick=()=>{if(!state.nodes.length)return;const minX=Math.min(...state.nodes.map(n=>n.x)),minY=Math.min(...state.nodes.map(n=>n.y)),maxX=Math.max(...state.nodes.map(n=>n.x+224)),maxY=Math.max(...state.nodes.map(n=>n.y+document.getElementById(n.id).offsetHeight));const scale=Math.max(.25,Math.min(1,(innerWidth-40)/(maxX-minX),(innerHeight-230)/(maxY-minY)));state.view={scale,x:(innerWidth-(maxX-minX)*scale)/2-minX*scale,y:115-minY*scale};position();save();};
$('#show-json').onclick=()=>{changed();$('#json-sheet').showModal();};$('#close-json').onclick=()=>$('#json-sheet').close();
$('#copy').onclick=async()=>{const value=$('#json-output').value;try{await navigator.clipboard.writeText(value);$('#copy').textContent='Copiato ✓';}catch{const area=$('#json-output');area.focus();area.select();try{if(!document.execCommand('copy'))throw Error();$('#copy').textContent='Copiato ✓';}catch{$('#copy').textContent='Selezionato: tieni premuto e copia';}}};
$('#reset').onclick=()=>$('#reset-dialog').showModal();$('#cancel-reset').onclick=()=>$('#reset-dialog').close();$('#confirm-reset').onclick=()=>{state=emptyState();storageIssue='';selected=null;$('#reset-dialog').close();render();changed();status('Pronto per una nuova costruzione.');};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){select(null);$('#palette').hidden=true;$('#add').setAttribute('aria-expanded','false');}});window.addEventListener('resize',position);window.addEventListener('pagehide',save);
render();changed();if(storageIssue)status(storageIssue);
