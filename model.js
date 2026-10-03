export const TYPES = {object:'Scatola',list:'Lista',text:'Testo',number:'Numero',boolean:'Sì / No'};
export const emptyState = () => ({version:1,nodes:[],view:{x:0,y:0,scale:1}});
export const children = (s,id) => s.nodes.filter(n=>n.parent===id);
export function branch(s,id) { return [id,...children(s,id).flatMap(n=>branch(s,n.id))]; }
export function uniqueKey(s,key,parent,exclude) {
  const used=children(s,parent).filter(n=>n.id!==exclude).map(n=>n.key); let next=key, i=2;
  while(used.includes(next)) next=`${key}_${i++}`; return next;
}
export function addNode(s,type,x,y) {
  if(!TYPES[type]) throw Error('Tipo sconosciuto');
  const n={id:crypto.randomUUID(),type,key:uniqueKey(s,TYPES[type],null),value:type==='number'?0:type==='boolean'?false:'',x,y,parent:null};
  s.nodes.push(n); return n;
}
export function canConnect(s,id,parent) {
  return id!==parent && s.nodes.some(n=>n.id===id) && s.nodes.some(n=>n.id===parent && ['object','list'].includes(n.type)) && !branch(s,id).includes(parent);
}
export function connect(s,id,parent) {
  if(!canConnect(s,id,parent)) return false;
  const n=s.nodes.find(n=>n.id===id); n.key=uniqueKey(s,n.key,parent,id); n.parent=parent;
  // Array order is insertion order, including reconnection.
  s.nodes=s.nodes.filter(v=>v.id!==id); s.nodes.push(n); return true;
}
export function disconnect(s,id) { const n=s.nodes.find(n=>n.id===id); n.key=uniqueKey(s,n.key,null,id); n.parent=null; }
export function serialize(s) {
  const object = ns => Object.fromEntries(ns.map(n=>[n.key,value(n)]));
  const value = n => n.type==='object'?object(children(s,n.id)):n.type==='list'?children(s,n.id).map(value):n.value;
  return object(children(s,null));
}
export function restore(raw) {
  const s=JSON.parse(raw);
  if(s?.version!==1 || !Array.isArray(s.nodes) || s.nodes.length>500) throw Error('Salvataggio non valido');
  const ids=new Set(s.nodes.map(n=>n.id));
  if(ids.size!==s.nodes.length) throw Error('ID duplicati');
  for(const n of s.nodes) {
    if(typeof n.id!=='string'||!TYPES[n.type]||typeof n.key!=='string'||!Number.isFinite(n.x)||!Number.isFinite(n.y)) throw Error('Nodo non valido');
    if(n.type==='number'&&!Number.isFinite(n.value)||n.type==='text'&&typeof n.value!=='string'||n.type==='boolean'&&typeof n.value!=='boolean') throw Error('Valore non valido');
    const seen=new Set([n.id]); let p=n.parent;
    while(p!==null) { if(seen.has(p)||!ids.has(p)) throw Error('Gerarchia non valida'); seen.add(p); const parent=s.nodes.find(v=>v.id===p); if(!['object','list'].includes(parent.type)) throw Error('Parent non valido'); p=parent.parent; }
    if(children(s,n.parent).some(v=>v.id!==n.id&&v.key===n.key)&&s.nodes.find(v=>v.id===n.parent)?.type!=='list') throw Error('Nomi duplicati');
  }
  if(!s.view||![s.view.x,s.view.y,s.view.scale].every(Number.isFinite)||s.view.scale<0.25||s.view.scale>1.5) s.view={x:0,y:0,scale:1};
  return s;
}
