# RUNBOOK
Guide opérationnel minimal pour exécuter le déploiement manuel défini dans le repo, sans exposer d'infrastructure personnelle.

## Déploiement GitHub Actions
- Workflow: `.github/workflows/deploy-manual.yml`
- Trigger: `workflow_dispatch`
- Inputs:
  - `environment` (défaut: `home`)
  - `ref` (défaut: `main`)

## Secrets requis
Configurer ces secrets GitHub Actions (placeholders uniquement):

| Secret | Placeholder |
| --- | --- |
| `SSH_HOST` | `<ssh_host>` |
| `SSH_USER` | `<ssh_user>` |
| `SSH_PRIVATE_KEY` | `<private_key_pem>` |
| `SSH_PORT` | `<22>` |

## Script appelé par le workflow
- Script: `scripts/deploy-home.sh`
- Comportement vérifiable dans le script:
  - checkout de la `ref` demandée;
  - build Docker via `docker build -t tetris-app:latest .`;
  - redémarrage du conteneur `tetris`;
  - healthcheck HTTP local côté serveur distant.

## Vérification locale (hors déploiement distant)
```bash
npm ci
npm run build:prod
docker build -t tetrigular .
docker run --rm -p 8080:80 tetrigular
```

Puis ouvrir `http://localhost:8080`.
