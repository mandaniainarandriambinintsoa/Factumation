# ADR 0001 — Modèle de taxe et retenue

- Statut : accepté
- Date : 2026-09-21

## Contexte

Le produit actuel appelle `taxRate` un pourcentage déduit du sous-total. L'interface affiche une retenue, tandis que la base et l'email conservent actuellement le sous-total avant retenue. La future API doit aussi pouvoir représenter une TVA ajoutée.

## Décision

Le modèle cible distingue trois modes :

- `none` : aucune taxe ni retenue ;
- `vat` : taxe ajoutée au sous-total ;
- `withholding` : retenue déduite du montant à payer.

Chaque calcul renvoie explicitement `subtotal`, `taxAmount`, `withholdingAmount`, `total` et `amountDue`. Les anciens documents restent sous `calculationVersion = legacy-v1` et ne sont jamais recalculés silencieusement.

## Conséquences

- le champ ambigu `taxRate` reste lisible pendant la compatibilité, mais n'est plus suffisant pour les nouveaux contrats ;
- les templates PDF/email utilisent uniquement les montants persistés par le backend ;
- une migration métier devra décider comment mapper les anciennes lignes sans modifier leur valeur historique.
