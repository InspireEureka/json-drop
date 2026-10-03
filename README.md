# JSON Drop

**Costruisci strutture JSON trascinando scatole.**

JSON Drop è un prototipo mobile-first per creare oggetti e liste senza scrivere parentesi, virgole o livelli di annidamento a mano. L’interfaccia è una canvas: aggiungi un nodo, gli dai un nome e lo agganci a un altro nodo compatibile. La vista JSON resta secondaria e si aggiorna dalla struttura visuale.

## L’idea

`crea una scatola → scrivi → trascina → aggancia → costruisci`

Un nodo collegato sotto un altro diventa un suo figlio. Spostare un nodo sposta con lui tutto il ramo, senza rompere la gerarchia.

## Tipi di nodo previsti

- **Scatola** — oggetto JSON, può contenere altri nodi.
- **Lista** — array JSON, mantiene l’ordine degli elementi.
- **Testo** — valore stringa.
- **Numero** — valore numerico.
- **Sì / No** — valore booleano.

## Esempio

Costruendo **Hangar → Veicoli → TIE**, il risultato può essere:

```json
{
  "Hangar": {
    "Veicoli": {
      "TIE": "Caccia imperiale"
    }
  }
}
```

## Principi della V0

- Pensata prima per il **touchscreen** e l’uso con una mano.
- Canvas essenziale, senza sidebar permanente.
- Connessioni visibili e aree di aggancio ampie.
- Modifica dei nomi direttamente sui nodi.
- JSON consultabile e copiabile, ma non al centro dell’esperienza.
- Nessun backend, account, automazione o sistema di plugin.

## Stato

Questa repo ospita il progetto **JSON Drop**. Il prototipo interattivo e la pubblicazione web non sono ancora inclusi in questa versione della repo.
