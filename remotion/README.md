# Remotion - Vidéos Factumation

Ce dossier contient les compositions vidéo pour Factumation créées avec Remotion.

## Structure

```
remotion/
├── index.ts              # Point d'entrée Remotion
├── Root.tsx              # Définition des compositions
├── style.css             # Styles Tailwind
├── tsconfig.json         # Config TypeScript
├── tailwind.config.js    # Config Tailwind
└── compositions/
    ├── FactumationPromo.tsx      # Vidéo promo (20s)
    ├── FactumationFeatures.tsx   # Fonctionnalités (30s sans compte, 40s avec compte)
    └── FactumationDemo.tsx       # Démo complète (50s)
```

## Compositions Disponibles

### 1. FactumationPromo (20 secondes)
Vidéo promotionnelle courte avec :
- Animation du logo avec rotation
- Titre animé lettre par lettre
- Sous-titre avec effet machine à écrire
- Présentation des 4 fonctionnalités principales
- Call-to-action final

### 2. FactumationFeatures (30 secondes - sans connexion)
Présentation des fonctionnalités gratuites :
- Création de factures et devis
- Export PDF
- Multi-devises (EUR, USD, GBP, CAD, CHF, MGA)
- Régions fiscales (Europe, Madagascar, International)

### 3. FactumationFeaturesConnected (40 secondes - avec connexion)
Présentation des fonctionnalités premium :
- Historique complet
- Carnet clients
- Multi-sociétés
- Envoi par email
- Synchronisation
- Suivi des paiements
- Webhooks n8n

### 4. FactumationDemo (50 secondes)
Démonstration complète du workflow :
- Étape 1: Ouvrir l'application
- Étape 2: Remplir les informations client
- Étape 3: Ajouter des prestations
- Étape 4: Exporter (PDF, Email, Sauvegarder)
- Call-to-action final

## Commandes

### Lancer le Studio Remotion
```bash
npm run remotion:studio
```
Le studio s'ouvre sur http://localhost:3002

### Rendre les vidéos

```bash
# Vidéo promo
npm run remotion:render:promo

# Fonctionnalités (sans connexion)
npm run remotion:render:features

# Fonctionnalités (avec connexion)
npm run remotion:render:features-connected

# Démo complète
npm run remotion:render:demo

# Render personnalisé
npx remotion render remotion/index.ts <CompositionId> out/video.mp4
```

## Spécifications Techniques

- **Résolution** : 1920x1080 (Full HD)
- **FPS** : 30
- **Format** : MP4 (H.264)
- **Couleurs** : Palette Factumation (primary-900: #1e3a8a)
- **Police** : Inter (Google Fonts)

## Animations Utilisées

- `spring()` - Animations naturelles avec rebond
- `interpolate()` - Transitions linéaires et avec easing
- `TransitionSeries` - Transitions entre scènes (fade, slide)
- Effet typewriter pour le texte
- Animation lettre par lettre pour les titres

## Personnalisation

### Modifier les textes
Éditez les `defaultProps` dans `Root.tsx` ou directement dans les compositions.

### Modifier les couleurs
Les couleurs utilisent la palette Tailwind définie dans `tailwind.config.js`.

### Ajouter une nouvelle composition
1. Créez un fichier dans `compositions/`
2. Ajoutez la composition dans `Root.tsx`
3. Testez avec le studio

## Dépendances

- `remotion` - Framework vidéo React
- `@remotion/cli` - CLI pour le rendu
- `@remotion/transitions` - Transitions entre scènes
- `@remotion/tailwind` - Support Tailwind CSS
