# JSON Drop

**Costruisci strutture JSON trascinando scatole.**

Web app statica mobile-first: cinque tipi di nodo, editing inline, drag con Pointer Events, socket con snap, JSON live e salvataggio automatico nel browser. Nessun backend, account o dipendenza a runtime.

## Come si usa

1. Premi **+** in alto a sinistra e scegli Scatola, Lista, Testo, Numero o Sì/No.
2. Tocca il nome o il valore per modificarlo.
3. Trascina **la testata** per spostare il nodo insieme al suo ramo.
4. Trascina **↗ Collega** su **⊕ Aggancia qui**: l'aggancio si illumina, poi rilascia. In alternativa premi Collega e tocca il socket del genitore.
5. Usa **Scollega** per rendere nuovamente indipendente un nodo. Lo spostamento normale non cambia la gerarchia.
6. Apri **{ }** per vedere e copiare il JSON. Il progetto viene salvato a ogni modifica.

Trascina lo sfondo per esplorare; − / + cambiano lo zoom; **Centra** inquadra la costruzione. **Nuovo** chiede conferma prima del reset. **×** elimina un ramo con conferma. Nei figli di una lista, **↑** anticipa l'elemento. Le frecce della tastiera spostano il ramo quando la testata ha il focus.

## Regole dei dati

- I nodi indipendenti diventano proprietà di un oggetto radice.
- Le Scatole diventano oggetti; le Liste diventano array ordinati per aggancio. I nomi dei figli di una lista sono etichette visuali e non diventano chiavi dell'array.
- I numeri restano numeri e Sì/No diventa `true` / `false`.
- I cicli sono impediti. I nomi duplicati negli oggetti sono rifiutati durante l'editing; agganciando o scollegando un nodo vengono disambiguati con `_2`, `_3`, ecc. Nessuna proprietà viene sovrascritta silenziosamente.
- Un numero vuoto o non valido conserva l'ultimo valore valido e mostra un errore inline.
- I dati restano nel `localStorage` di quel browser e di quell'origine; non sono sincronizzati tra dispositivi. La navigazione privata o la cancellazione dei dati del sito possono rimuoverli.
- Un salvataggio corrotto non viene sovrascritto automaticamente: il messaggio invita a usare Nuovo per ricominciare.

Esempio: Scatola **Hangar** → Lista **Veicoli** → Testo **TIE**, valore **Caccia imperiale**:

```json
{
  "Hangar": {
    "Veicoli": ["Caccia imperiale"]
  }
}
```

## Avvio e test

Richiede solo un server statico per l'app; Node 22+ e Python 3 per i comandi di sviluppo:

```sh
npm start
# http://localhost:8080
```

```sh
npm ci
npm test
npx playwright install --with-deps chromium webkit
# Con npm start attivo in un altro terminale:
npm run test:browser
```

Il test browser esegue lo scenario completo di `prompt.md` su Chromium e WebKit, desktop e viewport mobile. Chromium mobile include touch nativo tramite protocollo browser e cancellazione gesture. `BROWSER_ENGINE=chromium` o `webkit` limita l'esecuzione; `TEST_URL` seleziona l'origine. `CHROMIUM_EXECUTABLE` permette di usare un browser già installato.

GitHub Actions esegue i test modello e browser a ogni push/PR. I risultati effettivamente ottenuti durante l'implementazione sono in [TESTING.md](TESTING.md).

## Pubblicazione HTTPS

Il repository è pronto per essere servito staticamente dalla radice; `.nojekyll` evita elaborazioni Jekyll. Non serve una build e non vanno pubblicati `node_modules`.

**Passaggio manuale rimasto:** nelle [impostazioni Pages](https://github.com/InspireEureka/json-drop/settings/pages), seleziona **Deploy from a branch → main → / (root) → Save**, se Pages è disponibile per il piano della repository privata.

Usa poi l'URL confermato da GitHub nella stessa schermata. Non è stato verificato alcun URL pubblico di produzione. Se GitHub richiede un piano compatibile per Pages su repository privata, l'abilitazione resta bloccata dal piano: la repository non deve essere resa pubblica automaticamente. La visibilità del sito e quella del repository sono impostazioni distinte.

## File

- `index.html`, `style.css`: interfaccia e layout mobile.
- `app.js`: rendering, gesture, controlli, persistenza e copia.
- `model.js`: stato, gerarchie, validazione e serializzazione separati dal DOM.
- `tests/`: test automatici di modello e percorso browser.
- `.github/workflows/test.yml`: verifica continua.
- `prompt.md`: specifica originale, conservata.

## Limiti V0

Nessun undo o importazione JSON. Pensata per qualche decina di nodi. Zoom con pulsanti e pan a un dito; nessuna gesture pinch personalizzata. Il fit di strutture molto grandi riduce anche i controlli: aumenta lo zoom per modificarle. Safari su iPhone fisico, tastiera iOS, notch e gesture di sistema richiedono ancora una verifica sul dispositivo.

## Licenza

JSON Drop è distribuito sotto **GNU Affero General Public License v3.0 (AGPL-3.0)**. Puoi usare, studiare, modificare e ridistribuire il software secondo i termini della licenza. Le versioni modificate offerte agli utenti tramite rete devono rendere disponibile il relativo codice sorgente come previsto dalla AGPLv3. Vedi [LICENSE](LICENSE).
