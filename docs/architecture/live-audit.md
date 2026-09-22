# Parcours de l'application en production

> Parcours anonyme réalisé le 21 septembre 2026 sur `https://factumation.vercel.app/fr` avec Chrome headless, formats desktop et mobile. Aucun compte ni donnée utilisateur n'a été utilisé.

## Périmètre parcouru

| Route           | Résultat                                          |
| --------------- | ------------------------------------------------- |
| `/fr`           | landing chargée, navigation et CTA présents       |
| `/fr/create`    | formulaire facture complet accessible sans compte |
| `/fr/quote`     | formulaire devis complet accessible sans compte   |
| `/fr/pricing`   | plans Free/Pro/Business et paiement Papi visibles |
| `/fr/about`     | présentation et fonctionnalités avec compte       |
| `/fr/contact`   | formulaire et coordonnées visibles                |
| `/fr/dashboard` | redirection vers `/fr` sans session               |
| `/fr/settings`  | redirection vers `/fr` sans session               |

Toutes les pages testées ont répondu HTTP 200. Aucune erreur console ni requête réseau échouée n'a été observée pendant ce parcours.

## Fonctionnalités confirmées visuellement

- création de facture et devis sans inscription ;
- informations client et société ;
- choix fiscal particulier, Madagascar ou Europe/France ;
- dates, devise, moyen de paiement et retenue/déduction ;
- lignes dynamiques, notes et aperçu ;
- six devises et six moyens de paiement ;
- plans et paiement Mobile Money/Papi ;
- routes privées redirigées pour un visiteur anonyme ;
- navigation française et bascule vers l'anglais.

## Constats mobile

Le formulaire facture à 390 px de largeur produit une page d'environ 2 927 px de hauteur avant même l'ajout de lignes ou de champs fiscaux. Il confirme la nécessité du wizard mobile.

Le tableau des prestations conserve une disposition de tableau desktop : certaines colonnes et le champ description sont comprimés ou sortent de la zone visible. La future étape « Prestations » doit utiliser des cartes/lignes empilées sur mobile, pas un tableau horizontal réduit.

Les boutons d'action ne restent pas accessibles pendant le défilement. Une barre sticky `Précédent/Suivant` avec prise en compte de la safe area est justifiée.

## PWA

Sur les pages parcourues :

- aucun `<link rel="manifest">` ;
- aucun service worker ne contrôle la page ;
- l'API Service Worker du navigateur est disponible, mais non utilisée.

L'application live n'est donc pas encore installable comme PWA.

## Cohérence métier confirmée

Le libellé live précise que `Taxe (%)` est un « pourcentage déduit du sous-total (retenue, escompte...) ». Le comportement de soustraction observé dans le code n'est donc pas une simple erreur d'affichage : c'est une fonctionnalité actuelle à préserver sous le nom explicite `withholding`/retenue lors de la migration.

Un scénario anonyme a également été rempli jusqu'à l'aperçu avec une ligne à 100 EUR et un taux de 20 %. L'édition et l'aperçu ont tous deux affiché : sous-total 100 EUR, déduction 20 EUR et total à payer 80 EUR. Les actions proposées ensuite sont modifier, télécharger le PDF et envoyer la facture ; la conservation dans l'historique demande une connexion et l'email indique la restriction Pro.

Cela ne remplace pas une vraie TVA ajoutée. La cible doit supporter séparément :

- aucune taxe ;
- TVA/taxe ajoutée ;
- retenue ou déduction.

## Limites du parcours

Sans compte de test dédié, ce passage n'a pas exercé :

- dashboard authentifié et conversion multi-devises ;
- CRUD clients et sociétés ;
- sauvegarde de l'historique ;
- génération et téléchargement effectifs du PDF ;
- email et relance ;
- Stripe/Papi jusqu'au retour de paiement ;
- administration ;
- politiques RLS en conditions authentifiées.

Un compte staging non privilégié et des destinataires email sandbox seront nécessaires pour un E2E complet. Aucun compte personnel ou donnée de production ne doit être utilisé pour ces tests.
