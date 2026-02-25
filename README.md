# Tetrigular

[![CI](https://github.com/arnaud-wissart-lab/Tetrigular/actions/workflows/ci.yml/badge.svg)](https://github.com/arnaud-wissart-lab/Tetrigular/actions/workflows/ci.yml)
[![Déploiement Manuel](https://github.com/arnaud-wissart-lab/Tetrigular/actions/workflows/deploy-manual.yml/badge.svg)](https://github.com/arnaud-wissart-lab/Tetrigular/actions/workflows/deploy-manual.yml)

Projet Angular standalone (TypeScript strict) avec moteur de jeu découplé et rendu Canvas 2D.
Ce projet vise la compatibilité Node 20+ (Node >= 20.19.0 recommandé).

Démo live : http://tetris.arnaudwissart.fr

## Prérequis

- Node.js >= 20.19.0
- npm >= 9

## Lancement local

```bash
npm ci
npm start
```

Application: http://localhost:4200

## Build production

```bash
npm run build
```

Alternative explicite:

```bash
npm run build:prod
```

Build généré dans `dist/` (selon Angular, typiquement `dist/tetris-angular/browser`).

Build Docker:

```bash
docker build -t tetrigular .
```

## Déploiement Docker

```bash
docker build -t tetrigular .
docker run --rm -p 8080:80 tetrigular
```

Le conteneur expose le port `80`.  
Application disponible sur: http://localhost:8080

## Contrôles

- `←` / `→`: déplacement (DAS/ARR)
- `↓` (maintenu): accélération de chute
- `Espace`: lâcher (chute instantanée)
- `↑`: rotation
- `P`: pause / reprise

## Capture GIF

![Capture gameplay (placeholder)](docs/tetris-gameplay.gif)

## Scripts

- `npm run start`: serveur de dev
- `npm run build`: build production
- `npm run build:prod`: build production explicite (`--configuration production`)
- `npm run lint`: ESLint (Angular ESLint)
- `npm run format`: Prettier (write)
- `npm run test`: tests unitaires
- `npm run test:ci`: tests unitaires non interactifs
- `npm run audit`: audit npm en mode CI (fail sur high/critical en production)
- `npm run ci`: lint + test:ci + build + audit

## CI

Le workflow GitHub Actions `CI` s'exécute sur le runner self-hosted (`self-hosted`, `linux`, `ci`) dans les cas suivants:

- `push` sur `main` avec modifications de code (ex: `src/**`, `public/**`, `scripts/**`, `package.json`, `angular.json`, `tsconfig*.json`, etc.)
- `pull_request` vers `main` avec modifications de code

Le workflow ne se déclenche pas si les changements concernent uniquement de la documentation/texte (par exemple `README.md`, `docs/**`, `*.md`, `*.txt`, `LICENSE`, `.gitignore`), car ces fichiers ne sont pas inclus dans le filtre `paths`.

## Déploiement manuel

Le déploiement home se lance uniquement via le bouton GitHub Actions (`workflow_dispatch`) avec le workflow `Déploiement Manuel`.

Inputs disponibles:

- `environment` (par défaut: `home`)
- `ref` (par défaut: `main`)

Le workflow exécute le script versionné `scripts/deploy-home.sh`, qui déploie sur `geekom-a5` en LAN via SSH, rebuild l'image Docker et relance le conteneur `tetris` sur le port `8081`.

Secrets GitHub requis (noms uniquement):

- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_PORT` (optionnel, défaut `22`)

## Mise à jour des dépendances

1. Vérifier les versions disponibles: `npm outdated`.
2. Mettre à jour les versions compatibles: `npm update`.
3. Pour une montée majeure ciblée: `npm install <package>@latest`.
4. Pour Angular, privilégier aussi: `npx ng update`.
5. Valider la qualité et la sécurité: `npm run ci`.
6. Committer `package.json` et `package-lock.json` ensemble.

Dependabot est activé (`.github/dependabot.yml`) en vérification hebdomadaire, avec un maximum de 5 PR ouvertes et le label `dependencies`.
