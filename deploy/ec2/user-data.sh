#!/usr/bin/env bash
set -euxo pipefail

APP_DIR=/opt/ak-store
REPO_URL="${REPO_URL:-__REPO_URL__}"
REPO_BRANCH="${REPO_BRANCH:-__REPO_BRANCH__}"

if command -v dnf >/dev/null 2>&1; then
  dnf install -y git
elif command -v yum >/dev/null 2>&1; then
  yum install -y git
elif command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y git
fi

if id -u ec2-user >/dev/null 2>&1; then
  APP_USER="ec2-user"
elif id -u ubuntu >/dev/null 2>&1; then
  APP_USER="ubuntu"
else
  APP_USER="$(id -un)"
fi

mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  sudo -u "$APP_USER" git fetch --all
  sudo -u "$APP_USER" git checkout "$REPO_BRANCH"
  sudo -u "$APP_USER" git pull --ff-only origin "$REPO_BRANCH"
fi

chmod +x "$APP_DIR"/deploy/ec2/*.sh
