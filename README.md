# Tetrigular

Projet Angular standalone (TypeScript strict) avec un moteur Tetris simple et auditable.

## Lancer

```bash
npm ci
npm run start
```

Application: http://localhost:4200

## Controles

- `←` / `→`: deplacer
- `↑`: rotation
- `↓`: descente
- `Espace`: chute rapide
- `P`: pause/reprise
- `R`: nouvelle partie

## Scripts

- `npm run start`: serveur de dev
- `npm run build`: build production
- `npm run lint`: ESLint (Angular ESLint)
- `npm run format`: Prettier (write)
- `npm run test`: tests unitaires
- `npm run test:ci`: tests unitaires non interactifs
- `npm run audit`: audit npm (fail sur high/critical en production)
- `npm run ci`: lint + test:ci + build + audit
