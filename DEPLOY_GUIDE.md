# AK Store Deploy Guide

## Target Hosted Setup

- Frontend: Vercel
- Backend API: EC2 + Nginx + Gunicorn + FastAPI
- Database: DynamoDB on AWS
- Uploaded product images: S3 on AWS

## Repo Files For EC2

- `backend/` -> FastAPI backend
- `backend/requirements.txt` -> backend Python dependencies
- `deploy/ec2/ak-store-api.service.template` -> systemd service template for Gunicorn
- `deploy/ec2/nginx-ak-store.conf` -> Nginx reverse proxy config
- `deploy/ec2/setup-server.sh` -> first-time EC2 server setup
- `deploy/ec2/deploy-backend.sh` -> backend deploy/restart script on EC2
- `front-web/vercel.ec2.template.json` -> Vercel rewrite template for EC2 cutover
- `START_AK_STORE.bat` -> local frontend + backend startup

## Current Live URLs

- Frontend: `https://ak-store-rxl.vercel.app`
- EC2 backend: `http://65.1.105.90`

## What Stays On AWS

- DynamoDB tables stay as-is
- S3 upload bucket stays as-is
- OTP emails use AWS SES
- the FastAPI compute layer now runs on EC2

## 1. Create EC2

Recommended instance:

- AMI: Ubuntu 24.04 LTS or 22.04 LTS
- Instance type: `t3.small` or `t3.medium`
- Storage: `20 GB` gp3
- Region: `ap-south-1`

Recommended security group:

- `22` from your IP only
- `80` from `0.0.0.0/0`
- `443` from `0.0.0.0/0`

Attach an IAM role to the instance with at least:

- DynamoDB read/write access for your app tables
- S3 access to `ak-store-api-prod-007222077181-uploads`
- CloudWatch Logs optional if you later add log shipping

Allocate and attach an Elastic IP.

## 2. Put Code On EC2

SSH into the server, install git if needed, and clone the repo:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/kaushik943/store_aws.git /opt/ak-store
cd /opt/ak-store
```

Create root `.env` on EC2 with production values:

```env
DATABASE_TYPE=dynamodb
AWS_REGION=ap-south-1
UPLOADS_BUCKET=ak-store-api-prod-007222077181-uploads
SECRET_KEY=replace-with-strong-secret
SES_FROM_EMAIL=verified-ses-sender@example.com
SES_CONFIGURATION_SET=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://ak-store-rxl.vercel.app,http://YOUR_EC2_PUBLIC_HOST
```

If you are not using an EC2 IAM role, also add:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

Prefer the IAM role instead of static keys.

## 3. First-Time Server Setup On EC2

From inside `/opt/ak-store` run:

```bash
chmod +x deploy/ec2/setup-server.sh deploy/ec2/deploy-backend.sh
./deploy/ec2/setup-server.sh
```

This does:

- installs git, Python 3.11, venv, pip, nginx
- creates Nginx site config
- enables and restarts Nginx

## 4. Deploy Backend On EC2

From inside `/opt/ak-store` run:

```bash
./deploy/ec2/deploy-backend.sh
```

This does:

- creates the Python virtualenv if missing
- installs backend dependencies
- installs the systemd service
- starts `ak-store-api`

## 5. Verify EC2 Backend Directly

On the EC2 server:

```bash
curl http://127.0.0.1:8000/api/health
curl http://YOUR_EC2_PUBLIC_HOST/api/health
```

Expected response:

```json
{"status":"ok","database":"DynamoDB","region":"ap-south-1"}
```

## 6. Frontend Routing

Vercel already routes `/api/*` and `/uploads/*` to the EC2 backend through `front-web/vercel.json`.

Verify:

- `https://ak-store-rxl.vercel.app/api/health`
- `https://ak-store-rxl.vercel.app`

## 7. Optional HTTPS On EC2

If you attach a real domain to EC2, install Certbot and issue TLS:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Then point Vercel rewrites to `https://api.yourdomain.com` instead of raw EC2 IP.

## 8. Cleanup

Delete Lambda and API Gateway only after EC2 is confirmed stable.

Do not delete:

- DynamoDB tables
- S3 upload bucket
- IAM resources still used by EC2

## Local Development

Local still works the same:

Backend:

```powershell
venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```powershell
cd front-web
npm install
npm run dev:frontend
```

## Deployment Summary

- local changes in `backend/` -> deploy to EC2 with `./deploy/ec2/deploy-backend.sh`
- local changes in `front-web/` -> deploy to Vercel with `npx vercel --prod`
- DynamoDB and S3 remain shared between local, EC2, and frontend
