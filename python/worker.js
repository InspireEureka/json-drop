/* Python Drop keeps its interpreter off the UI thread. */
let ready;
async function engine() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js');
  const pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'
  });
  await pyodide.loadPackage('libcst');
  const response = await fetch('./engine.py');
  if (!response.ok) throw Error('Motore Python non disponibile.');
  pyodide.runPython(await response.text());
  return pyodide;
}
self.onmessage = async event => {
  const {id, data} = event.data;
  try {
    ready ??= engine();
    const pyodide = await ready;
    pyodide.globals.set('drop_payload', JSON.stringify(data));
    const result = JSON.parse(pyodide.runPython('handle(drop_payload)'));
    self.postMessage({id, ...result});
  } catch (error) {
    self.postMessage({id, ok: false, error: String(error.message || error)});
  }
};
