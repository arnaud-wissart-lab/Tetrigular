# Tetrigular

Projet Angular standalone (TypeScript strict) avec moteur de jeu découplé et rendu Canvas 2D.
Ce projet vise la compatibilité Node 20+ (Node >= 20.19.0 recommandé).

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
- `↓` (maintenu): soft drop
- `Espace`: hard drop
- `↑` ou `X`: rotation horaire
- `Z`: rotation anti-horaire
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

## Mise à jour des dépendances

1. Vérifier les versions disponibles: `npm outdated`.
2. Mettre à jour les versions compatibles: `npm update`.
3. Pour une montée majeure ciblée: `npm install <package>@latest`.
4. Pour Angular, privilégier aussi: `npx ng update`.
5. Valider la qualité et la sécurité: `npm run ci`.
6. Committer `package.json` et `package-lock.json` ensemble.

Dependabot est activé (`.github/dependabot.yml`) en vérification hebdomadaire, avec un maximum de 5 PR ouvertes et le label `dependencies`.
