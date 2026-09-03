# Tetrigular

Jeu de blocs conçu comme vitrine Angular 21 : jouabilité clavier, moteur TypeScript indépendant du framework et chaîne de qualité prête à être revue.

[![CI](https://github.com/arnaud-wissart-lab/tetrigular/actions/workflows/ci.yml/badge.svg)](https://github.com/arnaud-wissart-lab/tetrigular/actions/workflows/ci.yml)
[![Déploiement manuel](https://github.com/arnaud-wissart-lab/tetrigular/actions/workflows/deploy-manual.yml/badge.svg)](https://github.com/arnaud-wissart-lab/tetrigular/actions/workflows/deploy-manual.yml)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-green.svg)](./LICENSE)

## Démo live

- Démo live : [https://tetris.arnaudwissart.fr](https://tetris.arnaudwissart.fr)

## Angular concepts demonstrated

- Composants standalone et stratégie de détection `OnPush` sur l’interface de jeu.
- État local avec `signal`, `input`, `output` et valeurs dérivées avec `computed`.
- Injection fonctionnelle avec `inject()` et nettoyage du cycle de vie avec `DestroyRef`.
- Routage Angular vers l’écran de jeu.
- Tests de composants Angular (signaux vers template, HUD, overlay et interaction de démarrage).
- TypeScript strict et templates strictement typés.
- Séparation entre l’interface Angular, l’entrée utilisateur et le moteur de jeu indépendant du framework.
- Vérification de formatage, CI GitHub Actions, audit des dépendances et image Docker Nginx.

## Fonctionnalités et architecture

- Architecture front séparée par responsabilités : `src/app/core/input`, `src/app/game/domain`, `src/app/game/engine`, `src/app/ui`.
- Moteur de jeu découplé (`GameEngine`) avec boucle `requestAnimationFrame`.
- Jouabilité clavier complète avec DAS/ARR (`120 ms` / `30 ms`), soft drop, hard drop, rotations et pause.
- Scoring déterministe (`100 / 300 / 500 / 800`) et progression du niveau toutes les 10 lignes.
- Randomizer `7-bag` (`Bag7Randomizer`) pour la distribution des tétriminos.
- Rendu Canvas 2D avec ghost piece, animation des lignes effacées et aperçu de la prochaine pièce.
- Qualité front outillée : ESLint, tests unitaires, build de production, audit sécurité et CI GitHub Actions.
- Chaîne de livraison documentée : workflow de déploiement manuel + image Docker Nginx.

## Captures

![Gameplay Tetrigular](./docs/screenshots/Animation.gif)

## Architecture

```mermaid
flowchart LR
  K["Clavier"] --> I["InputService"]
  I --> E["GameEngine"]
  E --> D["Domain: board, tetromino, scoring, bag7"]
  E --> S["État : score, lignes, niveau, statut"]
  S --> G["GameComponent (signals)"]
  G --> C["Canvas 2D (grille, ghost, flashes)"]
  S --> U["HUD + NextPiece + Overlay"]
```

## Stack technique

- Runtime cible : Node.js `20.20.1` (`.node-version` / `.nvmrc`) et npm `>=9` (`package.json > engines`).
- Gestionnaire de paquets : npm (`packageManager: npm@11.6.2`).
- Frontend : Angular `21.2.22`, Angular CLI / Build `21.2.23`, TypeScript `5.9.3`, RxJS `~7.8.0`.
- Qualité : ESLint `^10.9.1`, `angular-eslint` `21.4.0`, `typescript-eslint` `^8.69.0`, Vitest `^4.1.11`, Prettier `^3.9.6`.
- Conteneurisation : `Dockerfile` multi-stage (`node:20.20.1-alpine` pour le build, `nginx:alpine` à l’exécution).
- CI/CD : CI publique sur `ubuntu-latest` (`npm ci`, formatage, lint, tests, build de production, audit complet) et déploiement manuel isolé.

## Démarrage rapide

```bash
npm ci
npm run start
```

Ouvrir l'URL locale affichée par Angular CLI.

### Contrôles

- `←` / `→`: déplacement horizontal (DAS/ARR).
- `↓` (maintenu): soft drop.
- `Espace`: hard drop.
- `↑` ou `X`: rotation horaire.
- `Z`: rotation anti-horaire.
- `P`: pause / reprise.

## Tests

```bash
npm run test
npm run test:ci
npm run format:check
npm run lint
npm run build:prod
npm run audit
npm run ci
```

- La CI exécute `npm ci`, `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build:prod` et `npm run audit`.
- Le build Docker repose sur le même build de production Angular avant de servir les fichiers statiques avec Nginx.

## Sécurité & configuration

- Variables applicatives `.env`: aucune variable requise détectée côté application.
- Variables d'environnement référencées dans CI/déploiement:

| Variable          | Usage                                                  | Exemple (placeholder)                     |
| ----------------- | ------------------------------------------------------ | ----------------------------------------- |
| `CI`              | `.github/workflows/ci.yml` et `scripts/audit-ci.mjs`   | Défini par le workflow                    |
| `SSH_HOST`        | Secret GitHub Actions (`deploy-manual.yml`)            | `<ssh_host>`                              |
| `SSH_USER`        | Secret GitHub Actions (`deploy-manual.yml`)            | `<ssh_user>`                              |
| `SSH_PRIVATE_KEY` | Secret GitHub Actions (`deploy-manual.yml`)            | `<private_key_pem>`                       |
| `SSH_PORT`        | Secret GitHub Actions (`deploy-manual.yml`, optionnel) | `<22>`                                    |
| `GITHUB_TOKEN`    | Authentification Git du déploiement                    | Fourni automatiquement par GitHub Actions |

- Audit sécurité de toutes les dépendances : `npm run audit` (`npm audit --audit-level=high`).
- Détails opérationnels de déploiement : [docs/RUNBOOK.md](./docs/RUNBOOK.md).

## Licence

Licence : MIT
