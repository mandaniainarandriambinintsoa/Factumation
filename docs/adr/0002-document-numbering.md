# ADR 0002 — Numérotation des documents

- Statut : accepté
- Date : 2026-09-21

## Contexte

Les numéros actuels sont générés aléatoirement côté navigateur et modifiables par l'utilisateur. Ils ne sont pas sûrs en concurrence et aucune contrainte unique n'est visible dans le schéma versionné.

## Décision

Un brouillon n'a pas de numéro officiel. Le numéro est attribué par le backend lors de l'action d'émission, dans la même transaction que le changement d'état.

Un compteur PostgreSQL est identifié par société, type de document, période et préfixe. Une opération atomique incrémente ce compteur et une contrainte unique protège le numéro final.

## Conséquences

- l'UI peut afficher une référence temporaire de brouillon, mais ne l'appelle pas numéro de facture ;
- l'émission est idempotente ;
- un document émis ne peut plus revenir à un état modifiable qui changerait son identité ou ses montants ;
- le format legacy reste caractérisé jusqu'à l'activation du nouvel allocateur.
