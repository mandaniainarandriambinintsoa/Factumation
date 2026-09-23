# Capture assistée de documents

## Objectif métier

Réduire la saisie d'une facture ou d'un devis sans retirer le contrôle à l'utilisateur. Une photo ou une dictée produit un brouillon de formulaire. Aucun client et aucun document ne sont enregistrés avant la validation explicite dans le parcours normal en cinq étapes.

## Parcours utilisateur

1. L'utilisateur ouvre « Nouvelle facture » ou « Nouveau devis ».
2. Il choisit « Prendre une photo » ou « Dicter les informations ».
3. Le navigateur capture une image ou un message vocal de 60 secondes maximum.
4. L'API authentifiée analyse le média avec OpenRouter et retourne une proposition structurée.
5. Le formulaire est prérempli et revient à l'étape Client.
6. L'utilisateur vérifie successivement le client, les prestations, la facturation et le récapitulatif.
7. Les actions existantes créent ensuite le brouillon, émettent le document, produisent le PDF ou lancent l'envoi.

L'assistant ne choisit jamais l'entreprise émettrice et ne déclenche jamais une écriture métier.

## Architecture

```text
Caméra / microphone
        │ multipart, JWT Supabase
        ▼
NestJS /document-imports
        ├── validation taille, type MIME et signature binaire
        ├── image ───────────────► modèle vision OpenRouter
        └── audio ► transcription OpenRouter ► extraction structurée OpenRouter
                                           │
                                           ▼
                                  contrat DocumentImportResponse
                                           │
                                           ▼
                              React Hook Form, sans persistance
```

- `OpenRouterGateway` est la seule frontière avec le fournisseur IA.
- `DocumentImportsService` valide les médias et construit les avertissements métier.
- `@factumation/contracts` porte le schéma partagé et valide également la réponse dans le navigateur.
- Le formulaire garde une seule source de vérité et applique uniquement les champs effectivement extraits.

## Sécurité et exploitation

- Clé OpenRouter exclusivement côté API (`OPENROUTER_API_KEY`).
- Authentification utilisateur obligatoire ; les clés API externes en lecture seule ne peuvent pas appeler ces routes.
- Limite dédiée : six analyses par minute et par client.
- Maximum 8 Mo pour une image et 12 Mo pour l'audio ; JPEG, PNG, WebP et formats audio courants seulement.
- Les médias sont traités en mémoire et ne sont ni écrits sur disque ni stockés dans Supabase.
- Les requêtes vision imposent `data_collection: deny` et `zdr: true`.
- Pour la transcription, activer aussi une règle Zero Data Retention sur la clé ou l'organisation OpenRouter : les contrôles de routage par requête ne sont pas garantis sur cet endpoint.
- Les journaux conservent le statut et l'identifiant technique de la requête, jamais le média, la transcription ou la réponse du modèle.
- Aucun retry automatique : une répétition silencieuse pourrait doubler le coût.
- Timeout externe borné à 55 secondes.

## Configuration

```dotenv
OPENROUTER_API_KEY=...
OPENROUTER_EXTRACTION_MODEL=google/gemini-2.5-flash-lite
OPENROUTER_TRANSCRIPTION_MODEL=openai/gpt-4o-mini-transcribe
OPENROUTER_TIMEOUT_MS=55000
```

Les modèles sont configurables pour permettre une migration sans modification de code. Le modèle d'extraction doit accepter les images et les sorties JSON structurées.

## Limites de la première version

- Une seule page photographiée par analyse.
- Dictée courte, limitée à 60 secondes.
- Le score affiché par le backend représente la complétude des champs, pas une certitude probabiliste du modèle.
- Une facture entrante ne doit pas être créée comme facture de vente : le prompt extrait toujours le destinataire/acheteur en tant que client.
- La troisième fonctionnalité annoncée par le produit reste à préciser avant d'étendre ce flux.

## Références fournisseur

- Image : https://openrouter.ai/docs/guides/overview/multimodal/image-understanding
- Sorties structurées : https://openrouter.ai/docs/guides/features/structured-outputs
- Transcription : https://openrouter.ai/blog/tutorials/transcription-on-openrouter/
- Confidentialité et ZDR : https://openrouter.ai/docs/guides/get-started/sovereign-ai
