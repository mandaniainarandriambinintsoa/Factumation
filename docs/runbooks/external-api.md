# API externe Factumation v1

## Portée

La première version des credentials d'intégration est volontairement en lecture seule. Elle permet de consulter les factures, devis, clients et entreprises sans exposer une session utilisateur. Les mutations restent authentifiées par JWT Supabase jusqu'à ce que les RPC métier puissent exécuter quota, numérotation et idempotence au nom d'un principal d'intégration sans contourner les invariants.

Scopes disponibles :

- `invoices:read`
- `quotes:read`
- `clients:read`
- `companies:read`

Une liste `allowedCompanyIds` vide autorise toutes les entreprises du propriétaire. Une liste non vide restreint les entreprises et documents retournés. Les clés sont limitées à 300 requêtes par minute par credential au moyen d'un compteur PostgreSQL partagé entre toutes les instances API.

## Créer une clé

La gestion des clés requiert un JWT Supabase utilisateur. La clé brute n'est renvoyée qu'une fois.

```bash
curl -X POST "$API_URL/api/v1/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Comptabilité",
    "scopes": ["invoices:read", "clients:read"],
    "allowedCompanyIds": [],
    "expiresAt": "2027-09-21T00:00:00.000Z"
  }'
```

Stocker immédiatement le champ `apiKey` dans le gestionnaire de secrets du consommateur. Factumation conserve uniquement un HMAC SHA-256 avec un pepper serveur et un préfixe non secret.

## Appeler l'API

```bash
curl "$API_URL/api/v1/invoices?page=1&limit=20" \
  -H "X-API-Key: $FACTUMATION_API_KEY" \
  -H "Accept: application/json"
```

Ne pas envoyer simultanément `Authorization` et `X-API-Key`. Une clé ne peut pas appeler les routes d'abonnement, d'administration ou de gestion des clés.

## Rotation

La rotation crée un second credential actif. Deux credentials actifs au maximum sont autorisés pour un même client, afin de permettre un chevauchement contrôlé.

```bash
curl -X POST "$API_URL/api/v1/api-keys/$CLIENT_ID/rotate" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scopes":["invoices:read","clients:read"]}'
```

Après déploiement de la nouvelle clé chez le consommateur, révoquer l'ancienne :

```bash
curl -X DELETE "$API_URL/api/v1/api-keys/$OLD_KEY_ID" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

## Sécurité et exploitation

- `SUPABASE_SERVICE_ROLE_KEY` et `API_KEY_PEPPER` sont requis ensemble côté API et ne doivent jamais être exposés au Web.
- les logs structurés incluent l'identifiant de clé, jamais sa valeur ;
- `last_used_at`, les événements de création/rotation/révocation et les compteurs de rate limit servent au diagnostic ;
- révoquer une clé dès qu'une fuite est suspectée ;
- une réponse `401` signifie clé invalide/expirée/révoquée, `403` scope ou méthode refusée, `429` limite atteinte.
