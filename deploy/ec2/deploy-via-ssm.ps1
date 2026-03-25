param(
  [Parameter(Mandatory = $true)]
  [string]$InstanceId,

  [Parameter(Mandatory = $true)]
  [string]$EnvFile,

  [string]$Region = "ap-south-1",
  [string]$RepoUrl = "https://github.com/kaushik943/store_aws.git",
  [string]$RepoBranch = "main"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

$envContent = Get-Content -Raw $EnvFile
$envBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($envContent))

$commands = @(
  "set -euo pipefail",
  "if id -u ec2-user >/dev/null 2>&1; then APP_USER=ec2-user; elif id -u ubuntu >/dev/null 2>&1; then APP_USER=ubuntu; else APP_USER=`$(id -un); fi",
  "sudo mkdir -p /opt/ak-store",
  "sudo chown `$APP_USER:`$APP_USER /opt/ak-store",
  "if [ ! -d /opt/ak-store/.git ]; then sudo -u `$APP_USER git clone --branch $RepoBranch $RepoUrl /opt/ak-store; else cd /opt/ak-store && sudo -u `$APP_USER git fetch --all && sudo -u `$APP_USER git checkout $RepoBranch && sudo -u `$APP_USER git pull --ff-only origin $RepoBranch; fi",
  "echo '$envBase64' | base64 -d | sudo tee /opt/ak-store/.env >/dev/null",
  "sudo chmod +x /opt/ak-store/deploy/ec2/*.sh",
  "cd /opt/ak-store && sudo APP_USER=`$APP_USER ./deploy/ec2/setup-server.sh",
  "cd /opt/ak-store && sudo APP_USER=`$APP_USER ./deploy/ec2/deploy-backend.sh"
)

$payload = @{
  DocumentName = "AWS-RunShellScript"
  InstanceIds = @($InstanceId)
  Parameters = @{
    commands = $commands
  }
  Comment = "Deploy AK Store backend to EC2 without SSH"
} | ConvertTo-Json -Depth 6

$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "ak-store-ssm-command.json"
$payload | Set-Content -Path $tempFile -Encoding ascii

$commandId = aws ssm send-command --region $Region --cli-input-json file://$tempFile --query "Command.CommandId" --output text
aws ssm wait command-executed --region $Region --command-id $commandId --instance-id $InstanceId

$output = aws ssm get-command-invocation --region $Region --command-id $commandId --instance-id $InstanceId
Write-Output $output
