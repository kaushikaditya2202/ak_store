param(
  [string]$Region = "ap-south-1",
  [string]$FunctionName = "ak-store-otp-sender",
  [string]$RoleName = "ak-store-otp-lambda-role",
  [string]$ZipPath = "deploy\lambda\otp_sender.zip"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ZipPath)) {
  throw "Lambda zip not found: $ZipPath"
}

$trustPath = Join-Path $env:TEMP "ak-store-otp-lambda-trust.json"
@'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@ | Set-Content -Path $trustPath -Encoding ascii

$roleArn = aws iam get-role --role-name $RoleName --query "Role.Arn" --output text 2>$null
if (-not $roleArn) {
  $roleArn = aws iam create-role --role-name $RoleName --assume-role-policy-document file://$trustPath --query "Role.Arn" --output text
  aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole | Out-Null
}

$policyPath = Join-Path $env:TEMP "ak-store-otp-lambda-policy.json"
@'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "*"
    }
  ]
}
'@ | Set-Content -Path $policyPath -Encoding ascii

aws iam put-role-policy --role-name $RoleName --policy-name ak-store-otp-dynamodb --policy-document file://$policyPath | Out-Null

Start-Sleep -Seconds 10

$functionArn = aws lambda get-function --region $Region --function-name $FunctionName --query "Configuration.FunctionArn" --output text 2>$null
if ($functionArn) {
  aws lambda update-function-code --region $Region --function-name $FunctionName --zip-file fileb://$ZipPath | Out-Null
  aws lambda update-function-configuration --region $Region --function-name $FunctionName --runtime python3.11 --handler otp_sender.handler --timeout 30 --memory-size 256 --environment "Variables={AWS_REGION=$Region,USERS_TABLE=Users,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USE_SSL=false,SMTP_EMAIL=akstorerxl@gmail.com,SMTP_PASSWORD=hvwm rwxi cwoo wutn,SMTP_FROM_EMAIL=akstorerxl@gmail.com}" | Out-Null
} else {
  aws lambda create-function --region $Region --function-name $FunctionName --runtime python3.11 --handler otp_sender.handler --zip-file fileb://$ZipPath --timeout 30 --memory-size 256 --role $roleArn --environment "Variables={AWS_REGION=$Region,USERS_TABLE=Users,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USE_SSL=false,SMTP_EMAIL=akstorerxl@gmail.com,SMTP_PASSWORD=hvwm rwxi cwoo wutn,SMTP_FROM_EMAIL=akstorerxl@gmail.com}" | Out-Null
}

Write-Host $FunctionName
