#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[deploy-home] %s\n' "$1"
}

require_env() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    printf '[deploy-home] Variable requise absente: %s\n' "$var_name" >&2
    exit 1
  fi
}

require_env "SSH_HOST"
require_env "SSH_USER"
require_env "SSH_PRIVATE_KEY"
require_env "GITHUB_REPOSITORY"

SSH_PORT="${SSH_PORT:-22}"
DEPLOY_REF="${DEPLOY_REF:-main}"
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-home}"
REPO_URL="https://github.com/${GITHUB_REPOSITORY}.git"

if [ "$DEPLOY_ENVIRONMENT" != "home" ]; then
  log "Environnement '${DEPLOY_ENVIRONMENT}' non reconnu pour ce script (attendu: home)."
  exit 1
fi

log "Déploiement de ${GITHUB_REPOSITORY}@${DEPLOY_REF} vers ${SSH_USER}@${SSH_HOST}:${SSH_PORT}."

ssh_key_file="$(mktemp)"
cleanup() {
  rm -f "$ssh_key_file"
}
trap cleanup EXIT

umask 077
printf '%s\n' "$SSH_PRIVATE_KEY" >"$ssh_key_file"
chmod 600 "$ssh_key_file"

ssh_opts=(
  -i "$ssh_key_file"
  -p "$SSH_PORT"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
)

ssh "${ssh_opts[@]}" "${SSH_USER}@${SSH_HOST}" \
  bash -se -- "$DEPLOY_REF" "$REPO_URL" <<'REMOTE_SCRIPT'
set -euo pipefail

log() {
  printf '[remote] %s\n' "$1"
}

DEPLOY_REF="$1"
REPO_URL="$2"

APP_DIR="/home/arnaud/apps/tetrigular"
APP_PARENT_DIR="$(dirname "$APP_DIR")"

log "Préparation du dossier ${APP_DIR}"
mkdir -p "$APP_PARENT_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  log "Repository absent, clonage initial."
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

log "Mise à jour Git sur origin/${DEPLOY_REF}"
git fetch --prune origin
git reset --hard "origin/${DEPLOY_REF}"

log "Build de l'image Docker"
docker build -t tetris-app:latest .

if docker ps -a --format '{{.Names}}' | grep -Fxq 'tetris'; then
  log "Suppression du conteneur existant tetris"
  docker rm -f tetris
else
  log "Aucun conteneur tetris existant"
fi

log "Démarrage du conteneur tetris (8081 -> 80)"
docker run -d --name tetris -p 8081:80 --restart unless-stopped tetris-app:latest

log "Vérification HTTP locale sur 127.0.0.1:8081"
http_status="$(curl -sS -o /dev/null -I -w '%{http_code}' http://127.0.0.1:8081)"
if [ "$http_status" != "200" ]; then
  log "La vérification HTTP a échoué (code ${http_status})"
  exit 1
fi

log "Déploiement terminé avec succès (HTTP ${http_status})"
REMOTE_SCRIPT

log "Script terminé."
