#!/usr/bin/env bash
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y git python3.11 python3.11-venv python3-pip nginx curl
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y git python3.11 python3-pip nginx curl
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y git python3.11 python3-pip nginx curl
else
  echo "Unsupported package manager. Install git, python3.11, pip, and nginx manually."
  exit 1
fi

if ! python3.11 -m venv --help >/dev/null 2>&1; then
  python3.11 -m pip install --upgrade virtualenv
fi

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

sudo mkdir -p /opt/ak-store
sudo chown "$APP_USER":"$APP_USER" /opt/ak-store

if [ ! -d /opt/ak-store/venv ]; then
  python3.11 -m venv /opt/ak-store/venv
fi

/opt/ak-store/venv/bin/pip install --upgrade pip

if [ -d /etc/nginx/sites-available ]; then
  sudo cp deploy/ec2/nginx-ak-store.conf /etc/nginx/sites-available/ak-store-api
fi

if [ -d /etc/nginx/conf.d ]; then
  sudo cp deploy/ec2/nginx-ak-store.conf /etc/nginx/conf.d/ak-store-api.conf
fi

if [ -d /etc/nginx/sites-enabled ]; then
  sudo ln -sf /etc/nginx/sites-available/ak-store-api /etc/nginx/sites-enabled/ak-store-api
  sudo rm -f /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
