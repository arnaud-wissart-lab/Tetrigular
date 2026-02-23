# Tetrigular

Projet Angular standalone (TypeScript strict) avec moteur de jeu découplé et rendu Canvas 2D.

## Lancer

```bash
npm ci
npm run start
```

Application: http://localhost:4200

## Controles

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
- `npm run lint`: ESLint (Angular ESLint)
- `npm run format`: Prettier (write)
- `npm run test`: tests unitaires
- `npm run test:ci`: tests unitaires non interactifs
- `npm run audit`: audit npm (fail sur high/critical en production)
- `npm run ci`: lint + test:ci + build + audit
