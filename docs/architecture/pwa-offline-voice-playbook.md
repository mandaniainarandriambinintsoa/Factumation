# Playbook PWA hors ligne, OCR et voix

Ce document fixe les décisions réutilisables prises pendant l'évolution de Factumation. Il ne
remplace pas une analyse de risques propre à chaque client.

## Objectif produit

- rendre l'application installable sans dupliquer une application native ;
- permettre la saisie d'un brouillon quand la connexion disparaît ;
- reprendre automatiquement une opération explicitement demandée ;
- ne jamais sacrifier la confidentialité des documents de facturation ;
- garder les parcours photo et voix comme aides à la saisie, jamais comme sources de vérité.

## Architecture de référence

1. Le manifeste décrit l'identité, l'icône, la couleur et le mode `standalone`.
2. Le service worker ne met en cache que le shell public minimal et les assets versionnés. Les
   réponses authentifiées, les API, les PDF et les pages contenant des données métier ne vont pas
   dans Cache Storage.
3. Les brouillons privés sont validés, chiffrés en AES-GCM puis stockés dans IndexedDB. Une clé
   locale non exportable est conservée séparément dans IndexedDB. Cela protège surtout contre la
   lecture accidentelle du stockage ; cela ne protège pas contre un script exécuté sur l'origine ni
   contre un appareil déjà déverrouillé.
4. Une outbox bornée contient l'intention, le payload chiffré, la clé d'idempotence et les
   métadonnées de reprise. Aucun access token, cookie ou secret serveur n'y est conservé.
5. La page cliente reprend la file au chargement, au retour en ligne, au retour au premier plan et
   à la réception d'un événement Background Sync compatible. La session courante fournit le jeton
   au dernier moment.
6. Les erreurs réseau, 429 et 5xx sont reprises avec un backoff borné. Les 4xx métier bloquent
   l'élément et demandent une correction humaine. Une même opération garde toujours sa clé
   d'idempotence.
7. Déconnexion et changement de compte suppriment IndexedDB, les anciens brouillons localStorage
   et les caches de l'application.

## Limites à annoncer honnêtement

- Background Sync n'est pas disponible partout et un service worker n'a pas accès par magie à une
  session expirée. La reprise garantie se fait lorsque l'application est de nouveau ouverte avec
  une session valide.
- Un démarrage complètement à froid hors ligne ne doit pas réafficher une page authentifiée mise
  en cache. Sans shell métier statique dédié, il affiche la page hors ligne sûre.
- Le téléchargement d'un PDF nécessite une interaction ou une page ouverte. La synchronisation
  prépare le document, puis l'utilisateur ouvre le résultat pour télécharger le fichier.
- La modification hors ligne d'un document serveur existant demande une stratégie de conflit
  explicite (version, ETag ou `updatedAt`). Ne jamais faire de dernier-écrivain-gagnant en silence.

## Photo, OCR et voix

- Demander l'accès caméra/microphone uniquement après une action utilisateur et expliquer le but.
- Vérifier le contexte HTTPS, les permissions refusées, les interruptions téléphoniques, les codecs
  réellement disponibles et une taille/durée maximale avant l'enregistrement.
- Ne pas conserver l'image ou l'audio hors ligne par défaut. Stocker le brouillon structuré extrait ;
  conserver le média seulement avec consentement, durée de rétention et bouton de suppression.
- Le backend limite taille, type MIME et durée, impose un délai d'attente, authentifie l'appel et ne
  journalise ni média brut ni transcript personnel.
- La sortie OCR/LLM est non fiable : schéma strict, normalisation des montants/dates/devises, score
  ou avertissement d'incertitude, puis écran de vérification humaine avant toute émission/envoi.
- Le fournisseur et le modèle (par exemple OpenRouter) restent derrière une interface serveur.
  Prévoir modèle économique par défaut, timeout, budget par requête, fallback contrôlé et métriques
  coût/latence/erreur sans données personnelles.
- Ne jamais envoyer automatiquement une facture à partir d'une transcription. La voix préremplit ;
  l'utilisateur vérifie et confirme l'action finale.

## Checklist de livraison client

- [ ] HTTPS, manifeste, icônes 192/512, mode standalone et en-têtes du service worker vérifiés.
- [ ] Aucun endpoint authentifié ni document privé présent dans Cache Storage.
- [ ] IndexedDB versionné, chiffré, borné, avec TTL et nettoyage à la déconnexion.
- [ ] Outbox idempotente testée sur coupure avant requête, pendant réponse et après succès partiel.
- [ ] 4xx bloqués ; réseau/429/5xx repris avec backoff ; aucune boucle de retry infinie.
- [ ] Comptes multiples et plusieurs onglets testés sans fuite croisée ni doublon.
- [ ] Installation et reprise testées sur Android/Chrome et iPhone/Safari écran d'accueil.
- [ ] Refus caméra/micro, interruption d'appel, gros fichier et transcript invalide testés.
- [ ] Politique de confidentialité, rétention/suppression et sous-traitants IA documentés.
- [ ] Observabilité sans secrets ni données personnelles et procédure de rollback disponible.

## Décision Factumation actuelle

Factumation prend en charge le brouillon chiffré pendant que le formulaire est disponible, une file
de création bornée à 25 éléments et une reprise automatique avec la session active. Le service
worker garde une page de secours sûre pour le démarrage à froid hors ligne. Les modifications de
documents serveur existants restent en ligne afin d'éviter les conflits silencieux.
