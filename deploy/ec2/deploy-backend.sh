#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/ak-store
cd "$APP_DIR"

APP_USER="${APP_USER:-}"
if [ -z "$APP_USER" ]; then
  if id -u ec2-user >/dev/null 2>&1; then
    APP_USER="ec2-user"
  elif id -u ubuntu >/dev/null 2>&1; then
    APP_USER="ubuntu"
  else
    APP_USER="$(id -un)"
  fi
fi

APP_GROUP="${APP_GROUP:-}"
if [ -z "$APP_GROUP" ]; then
  if getent group www-data >/dev/null 2>&1; then
    APP_GROUP="www-data"
  else
    APP_GROUP="$APP_USER"
  fi
fi

WORKERS="${GUNICORN_WORKERS:-2}"

if [ ! -d venv ]; then
  python3.11 -m venv venv
fi

./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt

sed \
  -e "s/__APP_USER__/${APP_USER}/g" \
  -e "s/__APP_GROUP__/${APP_GROUP}/g" \
  -e "s/__WORKERS__/${WORKERS}/g" \
  deploy/ec2/ak-store-api.service.template | sudo tee /etc/systemd/system/ak-store-api.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable ak-store-api
sudo systemctl restart ak-store-api
sudo systemctl status ak-store-api --no-pager
