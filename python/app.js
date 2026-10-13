const $ = selector => document.querySelector(selector);
const worker = new Worker('./worker.js');
const pending = new Map();
let sequence = 0;
let view = [];
let source = '';
let filename = 'programma.py';
let items = [];
let ready = false;
let editing = null;
let readOnly = '';
const storageKey = 'python-drop:draft:v1';

worker.onmessage = event => {
  const resolve = pending.get(event.data.id);
  if (resolve) {
    pending.delete(event.data.id);
    resolve(event.data);
  }
};
worker.onerror = () => {
  for (const resolve of pending.values()) resolve({ok:false,error:'Motore Python non disponibile.'});
  pending.clear();
};
function request(data) {
  return new Promise(resolve => {
    const id = ++sequence;
    pending.set(id, resolve);
    worker.postMessage({id, data:{...data, view}});
  });
}
function status(message) { $('#status').textContent = message; }
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({source, filename})); }
  catch { status('La bozza non può essere salvata qui. Esporta il file prima di uscire.'); }
}
function trail() {
  $('#trail').replaceChildren();
  const root = document.createElement('button');
  root.textContent = filename;
  root.onclick = () => navigate([]);
  $('#trail').append(root);
  for (let depth = 0; depth < view.length; depth++) {
    const separator = document.createElement('span');
    separator.textContent = '›';
    $('#trail').append(separator);
    const button = document.createElement('button');
    button.textContent = viewNames[depth] || 'Blocco';
    const path = view.slice(0, depth + 1);
    button.onclick = () => navigate(path);
    $('#trail').append(button);
  }
}
let viewNames = [];
function actionButton(label, action, disabled = false) {
  const button = document.createElement('button');
  button.textContent = label;
  button.disabled = disabled;
  button.onclick = action;
  return button;
}
function render() {
  trail();
  $('#blocks').replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Qui non ci sono blocchi. Premi + Blocco per iniziare.';
    $('#blocks').append(empty);
  }
  for (const item of items) {
    const block = document.createElement('article');
    block.className = 'block' + (item.locked ? ' locked' : '');
    const heading = document.createElement('div');
    heading.className = 'block-head';
    const title = document.createElement('div');
    title.className = 'block-title';
    const type = document.createElement('small');
    type.textContent = item.kind;
    const name = document.createElement('strong');
    name.textContent = item.title || item.kind;
    title.append(type, name);
    heading.append(title);
    if (item.nested) {
      heading.append(actionButton('Apri ›', () => {
        viewNames.push(item.title);
        navigate(item.path);
      }));
    }
    block.append(heading);
    const preview = document.createElement('p');
    preview.className = 'block-preview';
    preview.textContent = item.preview;
    block.append(preview);
    if (!item.locked) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const index = item.path.at(-1);
      if (item.edit) actions.append(actionButton('Modifica', () => {
        editing = item;
        $('#kind').value = ({Variabile:'variable', Funzione:'function', Classe:'class'})[item.kind];
        $('#kind').disabled = true;
        $('#name').value = item.edit.name;
        $('#value-kind').value = item.edit.valueKind || 'number';
        $('#value').value = item.edit.value ?? '0';
        $('#create-submit').textContent = 'Salva modifica';
        updateForm();
        $('#create').showModal();
      }));
      actions.append(
        actionButton('↑', () => mutate('up', item.path), index === 0),
        actionButton('↓', () => mutate('down', item.path), index === items.length - 1),
        actionButton('Duplica', () => mutate('duplicate', item.path)),
        actionButton('Elimina', () => {
          if (confirm('Eliminare questo blocco e il suo contenuto?')) mutate('delete', item.path);
        })
      );
      actions.querySelectorAll('button')[item.edit ? 1 : 0].setAttribute('aria-label', 'Sposta sopra ' + item.title);
      actions.querySelectorAll('button')[item.edit ? 2 : 1].setAttribute('aria-label', 'Sposta sotto ' + item.title);
      block.append(actions);
    }
    $('#blocks').append(block);
  }
  $('#code').value = source;
}
async function navigate(path) {
  view = path;
  viewNames = viewNames.slice(0, path.length);
  const result = await request({action:'state'});
  if (result.ok) {
    items = result.items;
    render();
  } else status(result.error);
}
async function mutate(action, path, extra = {}) {
  status('Verifica del codice…');
  const result = await request({action, path, ...extra});
  if (!result.ok) { status(result.error); return false; }
  source = result.source;
  readOnly = result.readOnly || '';
  items = result.items;
  render();
  save();
  status('Codice valido. Bozza salvata nel browser.');
  return true;
}
async function openCode(text, name, restore = false) {
  status('Lettura del file Python…');
  const result = await request({action:'open', source:text});
  if (!result.ok) { status('File conservato senza modifiche: ' + result.error); return; }
  source = result.source;
  readOnly = result.readOnly || '';
  filename = name;
  view = [];
  viewNames = [];
  items = result.items;
  render();
  if (!restore) save();
  status(readOnly ? 'File conservato in sola lettura: ' + readOnly :
    'File pronto. I blocchi «Codice originale» sono protetti.');
}
$('#file').onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer());
    await openCode(text, file.name);
  } catch {
    status('Codifica non UTF-8: il file originale non è stato modificato.');
  }
  event.target.value = '';
};
$('#export').onclick = () => {
  if (!ready) return;
  const url = URL.createObjectURL(new Blob([source], {type:'text/x-python;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.py') ? filename : filename + '.py';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  status('File .py pronto per il salvataggio.');
};
$('#code-toggle').onclick = () => { $('#code').value = source; $('#code-sheet').showModal(); };
$('#close-code').onclick = () => $('#code-sheet').close();
$('#add').onclick = () => {
  if (!ready || readOnly) { if (readOnly) status('File in sola lettura: esporta l’originale.'); return; }
  editing = null;
  $('#kind').disabled = false;
  $('#kind').value = 'variable';
  $('#name').value = 'elemento';
  $('#value-kind').value = 'number';
  $('#value').value = '0';
  $('#create-submit').textContent = 'Aggiungi';
  updateForm();
  $('#create').showModal();
};
function updateForm() {
  const kind = $('#kind').value;
  $('#name-row').hidden = ['if','while','return'].includes(kind);
  $('#value-row').hidden = !['variable','if','while','return'].includes(kind);
  $('#count-row').hidden = kind !== 'for';
  $('#name-row').firstChild.textContent = ({
    variable:'Nome variabile', function:'Nome funzione', class:'Nome classe',
    for:'Nome elemento', import:'Nome modulo'
  })[kind] || 'Nome';
  if (kind === 'if' || kind === 'while') {
    $('#value-kind').value = 'variable';
    $('#value').value = 'True';
  }
}
$('#kind').onchange = updateForm;
$('#value-kind').onchange = () => {
  $('#value').value = {number:'0',text:'testo',variable:'nome'}[$('#value-kind').value];
};
$('#create-form').addEventListener('submit', async event => {
  if (event.submitter?.value !== 'create') return;
  event.preventDefault();
  const data = {
    kind:$('#kind').value, name:$('#name').value.trim(),
    valueKind:$('#value-kind').value, value:$('#value').value,
    count:$('#count').value
  };
  if (await mutate(editing ? 'edit' : 'add', editing ? editing.path : view, data)) $('#create').close();
});
updateForm();
(async () => {
  let draft;
  try { draft = JSON.parse(localStorage.getItem(storageKey)); }
  catch { status('Bozza precedente non leggibile. Il dato originale resta nel browser.'); }
  const result = await request({action:'state'});
  if (!result.ok) { status('Motore non caricato: ' + result.error); return; }
  ready = true;
  $('#export').disabled = false;
  if (draft && typeof draft.source === 'string') {
    await openCode(draft.source, draft.filename || 'programma.py', true);
  } else {
    items = result.items;
    source = result.source;
    render();
    status('Pronto. Aggiungi un blocco o apri un file .py.');
  }
})();
