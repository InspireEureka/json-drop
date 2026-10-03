# JSON Drop — Implementazione V0 completa

Lavora sulla repository esistente **`InspireEureka/json-drop`**.

Leggi prima il `README.md` e trattalo come contesto di prodotto.

## Obiettivo

Implementa **JSON Drop**, una web app mobile-first per costruire strutture JSON visivamente senza scrivere manualmente JSON, parentesi, array o annidamenti.

L'esperienza deve sembrare più vicina a un piccolo **gioco di costruzione** che a un IDE.

Il paradigma fondamentale è:

**Node + Socket + Drag & Drop + Snap**

L'utente crea scatole, scrive dentro di esse, le trascina e le aggancia tra loro.

La struttura visuale viene automaticamente tradotta in JSON.

Il JSON è un output della costruzione, non l'interfaccia principale.

---

# 1. TARGET

Target primario:

- Safari su iPhone
- Chrome/Chromium mobile
- browser desktop moderni

L'app deve essere una normale web app raggiungibile tramite HTTPS.

Deve funzionare bene senza installazione.

Non progettare il prodotto attorno all'apertura locale di file HTML.

Touchscreen first, desktop second.

---

# 2. VINCOLI ARCHITETTURALI

Questa è una V0.

Mantieni l'architettura estremamente piccola.

Preferisci:

- HTML
- CSS
- JavaScript
- Web APIs native

Puoi usare una libreria solo se risolve concretamente un problema difficile, soprattutto drag & drop, gesture o coordinate.

Non introdurre framework pesanti senza una ragione verificabile.

Non creare:

- backend
- database remoto
- autenticazione
- account
- API server
- AI
- collaborazione
- marketplace
- plugin system
- workflow engine
- automazioni
- infrastruttura non necessaria

L'app deve poter essere pubblicata come **sito statico**.

Struttura indicativa:

```text
/
├── index.html
├── style.css
├── app.js
└── README.md
```

Puoi dividerla ulteriormente solo se migliora realmente leggibilità e manutenzione.

---

# 3. MODELLO MENTALE

L'utente non deve pensare:

> “Sto modificando un AST JSON.”

Deve pensare:

> “Creo una scatola e la attacco a un'altra scatola.”

Flusso fondamentale:

```text
+
↓
scegli tipo
↓
crea nodo
↓
scrivi
↓
trascina
↓
avvicina a socket
↓
snap
↓
gerarchia
↓
JSON
```

Questa sequenza è il cuore del prodotto.

Qualunque funzione che non migliori questo ciclo è secondaria.

---

# 4. INTERFACCIA

La schermata principale deve essere estremamente minimale.

Deve contenere principalmente:

- canvas
- pulsante `+` in alto a sinistra
- controllo discreto per visualizzare il JSON

Niente sidebar permanente.

Niente toolbar pesante.

Niente dashboard.

Niente interfaccia da IDE.

Il canvas deve occupare quasi tutto il viewport.

Considera correttamente:

- safe area iPhone
- notch
- Dynamic Island
- barra inferiore Safari
- viewport mobile dinamico

Usa dove opportuno unità moderne come `dvh` e `env(safe-area-inset-*)`.

---

# 5. NODE PALETTE

Premendo `+` si apre una piccola **Node Palette**.

Tipi V0:

### Object / Scatola
Rappresenta un oggetto JSON. Può contenere altri nodi.

### List / Lista
Rappresenta un array JSON. Può contenere più elementi ordinati.

### Text / Testo
Valore stringa.

### Number / Numero
Valore numerico.

### Boolean / Sì-No
Valore booleano.

La palette deve essere compatta, leggibile con una mano e richiudibile facilmente.

Non usare modali enormi.

---

# 6. CREAZIONE DEI NODI

Toccando un tipo nella palette:

1. viene creato realmente un nuovo nodo;
2. compare sul canvas;
3. viene inserito nello stato interno;
4. può essere immediatamente modificato;
5. può essere trascinato;
6. può essere collegato ad altri nodi compatibili.

Non creare elementi puramente decorativi.

Ogni nodo visualizzato deve corrispondere a un'entità reale nel modello dati.

Ogni nodo deve avere almeno:

```text
id
type
key/name
value quando applicabile
position
parent
children oppure equivalente
```

Mantieni una singola fonte di verità.

Il DOM rappresenta lo stato. Non usare il DOM come database implicito.

---

# 7. MODIFICA INLINE

L'utente deve poter toccare il testo di un nodo e modificarlo direttamente.

Evita finestre modali.

Object e proprietà devono poter avere un nome.

Text deve permettere un valore testuale.

Number deve accettare numeri.

Boolean deve poter essere cambiato facilmente tra `true` e `false`.

La modifica deve aggiornare immediatamente lo stato e quindi il JSON risultante.

---

# 8. DRAG & DROP

Questa parte è critica.

Il trascinamento deve funzionare realmente su touchscreen.

Non affidarti esclusivamente al vecchio HTML5 Drag and Drop API se questo compromette Safari/iPhone.

Preferisci **Pointer Events** o un sistema equivalente robusto.

Devono funzionare touch, mouse, pointer, trascinamento continuo, rilascio e cancellazione/interruzione gesture.

Durante il drag:

- il nodo segue chiaramente il dito;
- non deve partire accidentalmente lo scroll della pagina;
- il testo non deve venire selezionato;
- il browser non deve interpretare la gesture come qualcosa di diverso;
- il canvas deve rimanere stabile.

Le hit area devono essere abbastanza grandi per un pollice.

---

# 9. SOCKET

I nodi che possono ricevere figli devono avere uno o più punti di aggancio chiaramente percepibili.

Chiamali internamente **socket**.

Il socket non deve essere minuscolo.

Quando un nodo trascinato entra nella zona di aggancio:

- evidenzia il socket;
- comunica chiaramente che il collegamento è possibile;
- mostra feedback immediato.

Non richiedere precisione chirurgica.

Il sistema deve essere indulgente.

---

# 10. SNAP

Quando il nodo viene rilasciato abbastanza vicino a un socket compatibile:

1. esegui lo snap;
2. registra la relazione nello stato;
3. aggiorna parent/children;
4. aggiorna la rappresentazione visuale;
5. aggiorna il JSON.

Lo snap deve essere visivamente soddisfacente ma breve.

Puoi usare una microanimazione.

Evita animazioni lunghe o decorative.

---

# 11. GERARCHIA

Una connessione rappresenta una relazione strutturale reale.

```text
Hangar
└── Veicoli
    └── TIE
```

non è soltanto una linea disegnata.

Deve esistere nello stato come relazione parent → child.

Se sposto `Hangar`, la struttura deve continuare ad esistere.

Se possibile, il ramo può muoversi insieme al genitore.

Non perdere relazioni quando i nodi vengono spostati.

Impedisci cicli come `A → B → C → A`.

Un nodo non può diventare figlio di sé stesso né di un proprio discendente.

---

# 12. DISCONNESSIONE

Deve essere possibile staccare un nodo dal genitore.

Trova l'interazione mobile più semplice e robusta, per esempio trascinamento fuori dal parent/socket oppure long press con azione “Scollega”.

Scegli la soluzione meno fragile.

Dopo la disconnessione:

- il nodo rimane sul canvas;
- parent viene rimosso;
- la struttura viene aggiornata;
- il JSON cambia immediatamente.

---

# 13. SPOSTAMENTO

I nodi devono poter essere riposizionati liberamente.

Lo spostamento puramente visuale non deve alterare accidentalmente la struttura.

Distingui chiaramente **MOVE** da **CONNECT / DISCONNECT**.

Evita che ogni trascinamento provochi connessioni accidentali.

---

# 14. JSON

Deve esistere una vista secondaria del JSON generato.

Non deve dominare l'interfaccia.

Può essere un pannello bottom-sheet, overlay o pannello richiudibile.

Deve mostrare il JSON prodotto **dallo stato reale corrente**.

Mai hardcoded. Mai una demo statica.

Ogni modifica visuale deve riflettersi nel JSON.

Deve essere possibile copiarlo facilmente.

Il JSON prodotto deve essere valido.

---

# 15. SERIALIZZAZIONE

Implementa una funzione esplicita che trasformi la struttura interna in JSON.

Mantieni separati:

```text
STATE
↓
SERIALIZER
↓
JSON
```

dalla parte:

```text
STATE
↓
RENDERER
↓
UI
```

UI e JSON devono essere due rappresentazioni dello stesso stato.

Non costruire il JSON leggendo casualmente elementi dal DOM.

---

# 16. PERSISTENZA LOCALE

Salva automaticamente il progetto nel browser usando `localStorage` o un'altra Web API locale semplice se realmente migliore.

Alla riapertura della pagina, la struttura precedente deve poter essere ripristinata.

Nessun account. Nessun server.

Aggiungi un comando discreto **Nuovo / Reset** con conferma per evitare cancellazioni accidentali.

---

# 17. MOBILE UX

Testa specificamente viewport simili a iPhone.

Verifica:

- touch target
- tastiera virtuale
- editing inline
- drag
- viewport resize
- orientamento
- safe areas
- scroll involontario
- zoom involontario
- selezione testo involontaria
- gesture browser

L'app deve essere utilizzabile con una mano per le operazioni fondamentali.

Non limitarti a ridimensionare un'interfaccia desktop.

---

# 18. DESIGN

Mantieni un'estetica minimale, pulita, leggermente futuristica, tattile e giocosa senza sembrare infantile.

I nodi devono sembrare oggetti manipolabili.

La gerarchia deve essere leggibile senza trasformare il canvas in una ragnatela.

Usa animazioni brevi per creazione, selezione, snap e apertura palette.

Non sacrificare la velocità alla decorazione.

---

# 19. PERFORMANCE

L'interazione durante il drag deve sembrare immediata.

Evita rerender completi inutili durante ogni `pointermove`.

Preferisci trasformazioni efficienti.

Non fare operazioni costose sul main thread durante il trascinamento.

La V0 non deve gestire migliaia di nodi, ma qualche decina deve risultare fluida anche su smartphone.

---

# 20. ACCESSIBILITÀ MINIMA

Non rendere il prodotto esclusivamente dipendente dal colore.

Usa etichette comprensibili.

Mantieni contrasto sufficiente.

I controlli principali devono avere `aria-label` quando necessario.

---

# 21. ERRORI DA NON COMMETTERE

Non consegnare:

- mockup statico;
- UI senza JavaScript funzionante;
- pulsanti decorativi;
- drag simulato;
- JSON hardcoded;
- socket che non modificano lo stato;
- demo desktop che su iPhone non funziona;
- architettura enorme per una V0;
- dipendenze inutili.

Non aggiungere feature finché il ciclo fondamentale non funziona.

---

# 22. TEST OBBLIGATORIO

Esegui realmente questo scenario:

1. carica l'app;
2. premi `+`;
3. verifica apertura palette;
4. crea Object;
5. chiamalo `Hangar`;
6. crea List;
7. chiamala `Veicoli`;
8. trascina `Veicoli`;
9. collegala a `Hangar`;
10. crea Text;
11. chiamalo `TIE`;
12. assegna un valore;
13. collegalo a `Veicoli`;
14. sposta `Hangar`;
15. verifica che la gerarchia sopravviva;
16. apri vista JSON;
17. verifica che il JSON rappresenti la struttura;
18. modifica `TIE`;
19. verifica aggiornamento JSON;
20. scollega `TIE`;
21. verifica aggiornamento JSON;
22. ricollegalo;
23. ricarica la pagina;
24. verifica persistenza;
25. prova Reset;
26. verifica stato vuoto.

Ripeti il test con viewport mobile.

Se qualcosa fallisce: **correggilo e ripeti il test.**

Non dichiarare completato il lavoro solo perché l'interfaccia viene renderizzata.

---

# 23. VALIDAZIONE TECNICA

Prima della consegna verifica almeno:

```text
creazione nodo       PASS
editing              PASS
drag mouse           PASS
drag touch/pointer   PASS
socket detection     PASS
snap                 PASS
parent-child         PASS
move                 PASS
disconnect           PASS
cycle prevention     PASS
serialization        PASS
JSON valido          PASS
copy JSON            PASS
local persistence    PASS
reload restoration   PASS
reset                PASS
mobile viewport      PASS
```

Se una voce non può essere verificata completamente nell'ambiente disponibile, dichiaralo esplicitamente.

Non inventare test superati.

---

# 24. REPOSITORY

Lavora esclusivamente su `InspireEureka/json-drop`.

Non modificare altre repository.

Aggiorna il README solo dove necessario per riflettere ciò che è stato realmente implementato.

Mantieni commit comprensibili.

Non inserire token, API key, password, credenziali o dati personali.

---

# 25. DEPLOY WEB

Il risultato finale deve essere distribuibile come sito statico.

Prepara il repository affinché possa essere pubblicato tramite GitHub Pages o equivalente hosting statico HTTPS.

Se hai gli strumenti e i permessi necessari per configurare direttamente il deployment, fallo.

Altrimenti prepara completamente il repository e indica **esattamente l'unico passaggio manuale rimasto**, senza trasformarlo in una guida enorme.

Il deployment non deve richiedere backend.

---

# 26. DEFINITION OF DONE

JSON Drop V0 è completato soltanto quando un utente da telefono può:

```text
aprire URL
↓
premere +
↓
creare scatola
↓
scrivere
↓
trascinare
↓
agganciare
↓
costruire gerarchia
↓
vedere JSON corretto
↓
chiudere browser
↓
tornare
↓
ritrovare il progetto
```

La domanda finale a cui il prototipo deve rispondere è:

> **“Costruire JSON trascinando e agganciando scatole da telefono è abbastanza naturale e piacevole da preferirlo alla scrittura manuale?”**

Ottimizza prima di tutto per poter rispondere bene a questa domanda.

## Consegna finale

Alla fine restituisci sinteticamente:

1. cosa hai implementato;
2. file creati/modificati;
3. test eseguiti e relativo risultato;
4. eventuali limiti reali rimasti;
5. URL web funzionante, se il deployment è disponibile;
6. commit finale.

Non fermarti alla pianificazione.

**Implementa, esegui, testa, correggi e valida il prototipo.**
