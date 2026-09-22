# ADR 0003 — Représentation monétaire

- Statut : accepté
- Date : 2026-09-21

## Contexte

Le frontend calcule aujourd'hui les montants avec des `number` JavaScript. Cette représentation binaire peut produire des écarts et aucune règle d'arrondi centrale n'existe.

## Décision

- l'API transporte les montants sous forme de chaînes décimales ;
- PostgreSQL les stocke avec `numeric`, jamais en flottant ;
- le domaine backend utilise une primitive Money/Decimal ;
- les calculs arrondissent à la précision de la devise à chaque frontière réglementaire définie ;
- le mode d'arrondi initial est `half-up`, documenté et testé par devise ;
- la devise est obligatoire et respecte ISO 4217, avec une configuration explicite de la précision MGA.

## Conséquences

Le frontend peut employer des nombres pour une prévisualisation non contractuelle, mais remplace toujours ses totaux par ceux retournés par l'API. Les conversions de reporting restent séparées des montants légaux du document.
