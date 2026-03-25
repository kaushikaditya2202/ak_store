# AK Store EC2 Deploy via AWS CLI and SSM

This flow avoids SSH entirely. You launch the instance with AWS CLI, wait for Systems Manager to come online, and deploy the app through SSM.

## Prerequisites

- AWS CLI installed and authenticated locally
- `ssm:GetParameter`, `ec2:*` needed for instance/network work
- An IAM instance profile already created for EC2 with:
  - `AmazonSSMManagedInstanceCore`
  - DynamoDB access for app tables
  - S3 access to the uploads bucket
- Your latest code pushed to a Git remote if EC2 should pull it directly

## Files

- `deploy/ec2/create-instance.ps1` creates the EC2 instance, security group, and Elastic IP
- `deploy/ec2/deploy-via-ssm.ps1` writes `.env`, installs dependencies, and starts the backend through SSM
- `deploy/ec2/user-data.sh` bootstraps the instance at first boot

## 1. Prepare an EC2 env file locally

Create a local file such as `deploy/ec2/prod.env`:

```env
AWS_REGION=ap-south-1
UPLOADS_BUCKET=ak-store-api-prod-007222077181-uploads
SECRET_KEY=replace-with-a-long-random-secret
SES_FROM_EMAIL=verified-ses-sender@example.com
SES_CONFIGURATION_SET=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://ak-store-rxl.vercel.app,http://YOUR_EC2_PUBLIC_IP
```

Prefer an EC2 IAM role over static AWS keys. If you must use keys, add them to this env file.

## 2. Create the EC2 instance

Run from Windows PowerShell:

```powershell
cd d:\production
.\deploy\ec2\create-instance.ps1 -InstanceProfileName YOUR_EC2_INSTANCE_PROFILE
```

Default behavior:

- region: `ap-south-1`
- AMI: latest Amazon Linux 2023 from AWS SSM Parameter Store
- instance type: `t3.micro`
- security group: opens `80` and `443`
- Elastic IP: allocated and attached
- SSM: waits until the instance is online

The script prints:

- `InstanceId`
- `PublicIp`
- `SecurityGroupId`
- `AllocationId`

## 3. Update CORS env before deploy

Replace `YOUR_EC2_PUBLIC_IP` in your env file with the `PublicIp` printed by the create script.

## 4. Deploy the backend through SSM

```powershell
cd d:\production
.\deploy\ec2\deploy-via-ssm.ps1 -InstanceId i-xxxxxxxxxxxxxxxxx -EnvFile .\deploy\ec2\prod.env
```

This command:

- clones or updates the repo in `/opt/ak-store`
- writes `/opt/ak-store/.env`
- runs `deploy/ec2/setup-server.sh`
- runs `deploy/ec2/deploy-backend.sh`
- starts nginx and the `ak-store-api` systemd service

## 5. Verify the backend

From your local machine:

```powershell
curl http://YOUR_EC2_PUBLIC_IP/api/health
```

Expected:

```json
{"status":"ok","database":"DynamoDB","region":"ap-south-1"}
```

## 6. Frontend Routing

Update `front-web/vercel.json` to point `/api/*` and `/uploads/*` to `http://YOUR_EC2_PUBLIC_IP/...`, then redeploy the frontend.

## 7. Redeploy later without SSH

Push code changes to your repo, then rerun:

```powershell
.\deploy\ec2\deploy-via-ssm.ps1 -InstanceId i-xxxxxxxxxxxxxxxxx -EnvFile .\deploy\ec2\prod.env
```

## Notes

- DynamoDB and S3 stay unchanged.
- For production HTTPS, point a domain to the Elastic IP and add TLS at nginx.
