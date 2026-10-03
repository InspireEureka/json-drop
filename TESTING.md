# Validazione — 3 ottobre 2026

## Eseguito nell'ambiente di sviluppo

- **4/4 test del modello PASS**: gerarchia Hangar/List/Text, serializzazione e ripristino; prevenzione cicli; nomi duplicati e `__proto__`; salvataggi corrotti; numeri, booleani e ordine degli array.
- **Scenario browser desktop PASS**, Chromium headless, viewport 1280×900.
- **Scenario browser mobile PASS**, Chromium headless, viewport 390×844, touch abilitato.
- Entrambi: apertura palette, creazione Object/List/Text, editing nomi e valori, aggancio con drag, socket e snap, movimento del ramo, JSON corretto, aggiornamento, scollegamento e ricollegamento, persistenza dopo reload, annullamento reset e reset confermato, ripristino vuoto. Nessun errore JavaScript.
- Desktop: drag mouse reale tramite browser automation.
- Mobile Chromium: drag touch tramite `Input.dispatchTouchEvent`, cancellazione gesture con rollback delle posizioni, assenza di scroll pagina, resize portrait/landscape.
- Copia: contenuto degli appunti letto e confrontato con il JSON corrente in Chromium.
- Screenshot desktop/mobile acquisiti e screenshot mobile ispezionato visivamente.

## Limiti della verifica

- Il browser locale usato è Chromium 153 (headless); il runner Playwright disponibile nell'ambiente è 1.62.1. Il repository fissa Playwright 1.61.1 per riproducibilità in CI.
- **WebKit non eseguito localmente**: il binario è disponibile, ma mancano librerie native; l'installazione delle dipendenze di sistema non è consentita nell'ambiente. Il test è incluso in GitHub Actions con installazione delle dipendenze su runner Ubuntu.
- **iPhone fisico non verificato**: tastiera virtuale, safe area e gesture Safari di sistema non sono provate dal solo viewport emulato.
- Nessun test di carico su hardware mobile fisico.
- Il deployment HTTPS non è attivo né verificato. L'abilitazione Pages richiede le impostazioni amministrative indicate nel README, non esposte dal connettore disponibile.

Non interpretare i test configurati in CI come già superati: i risultati del workflow GitHub sono separati dalle verifiche locali sopra.
