param(
  [Parameter(Mandatory = $true)]
  [string]$InstanceProfileName,

  [string]$Region = "ap-south-1",
  [string]$InstanceType = "t3.micro",
  [string]$Name = "ak-store-ec2",
  [string]$RepoUrl = "https://github.com/kaushik943/store_aws.git",
  [string]$RepoBranch = "main",
  [string]$SecurityGroupName = "ak-store-ec2-sg",
  [string]$ImageId = "",
  [string]$SubnetId = "",
  [int]$VolumeSize = 12
)

$ErrorActionPreference = "Stop"

function Get-DefaultVpcId {
  aws ec2 describe-vpcs --region $Region --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text
}

function Get-DefaultSubnetId {
  param([string]$VpcId)
  aws ec2 describe-subnets --region $Region --filters Name=vpc-id,Values=$VpcId Name=default-for-az,Values=true --query "Subnets[0].SubnetId" --output text
}

if (-not $ImageId) {
  $ImageId = aws ssm get-parameter --region $Region --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query "Parameter.Value" --output text
}

$vpcId = Get-DefaultVpcId
if (-not $SubnetId) {
  $SubnetId = Get-DefaultSubnetId -VpcId $vpcId
}

$sgId = aws ec2 describe-security-groups --region $Region --filters Name=group-name,Values=$SecurityGroupName Name=vpc-id,Values=$vpcId --query "SecurityGroups[0].GroupId" --output text
$ipPermissions = ConvertTo-Json -Compress -Depth 6 @(
  @{
    IpProtocol = "tcp"
    FromPort = 80
    ToPort = 80
    IpRanges = @(
      @{
        CidrIp = "0.0.0.0/0"
        Description = "HTTP"
      }
    )
  },
  @{
    IpProtocol = "tcp"
    FromPort = 443
    ToPort = 443
    IpRanges = @(
      @{
        CidrIp = "0.0.0.0/0"
        Description = "HTTPS"
      }
    )
  }
)

if (-not $sgId -or $sgId -eq "None") {
  $sgId = aws ec2 create-security-group --region $Region --group-name $SecurityGroupName --description "AK Store EC2 security group" --vpc-id $vpcId --query "GroupId" --output text
  aws ec2 authorize-security-group-ingress --region $Region --group-id $sgId --ip-permissions $ipPermissions | Out-Null
}

$userDataContent = Get-Content -Raw (Join-Path $PSScriptRoot "user-data.sh")
$userDataContent = $userDataContent.Replace("__REPO_URL__", $RepoUrl).Replace("__REPO_BRANCH__", $RepoBranch)
$userDataFile = Join-Path ([System.IO.Path]::GetTempPath()) "ak-store-user-data.sh"
$userDataContent | Set-Content -Path $userDataFile -Encoding ascii

$tagSpec = "ResourceType=instance,Tags=[{Key=Name,Value=$Name}]"
$blockDevice = ConvertTo-Json -Compress -Depth 6 @(
  @{
    DeviceName = "/dev/xvda"
    Ebs = @{
      VolumeSize = $VolumeSize
      VolumeType = "gp3"
      DeleteOnTermination = $true
    }
  }
)

$instanceId = aws ec2 run-instances `
  --region $Region `
  --image-id $ImageId `
  --instance-type $InstanceType `
  --iam-instance-profile Name=$InstanceProfileName `
  --security-group-ids $sgId `
  --subnet-id $SubnetId `
  --user-data file://$userDataFile `
  --tag-specifications $tagSpec `
  --block-device-mappings $blockDevice `
  --metadata-options "HttpTokens=required,HttpEndpoint=enabled" `
  --query "Instances[0].InstanceId" `
  --output text

aws ec2 wait instance-running --region $Region --instance-ids $instanceId

$allocationId = aws ec2 allocate-address --region $Region --domain vpc --query "AllocationId" --output text
aws ec2 associate-address --region $Region --instance-id $instanceId --allocation-id $allocationId | Out-Null

aws ssm wait instance-online --region $Region --instance-ids $instanceId

$publicIp = aws ec2 describe-instances --region $Region --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host "InstanceId: $instanceId"
Write-Host "PublicIp:   $publicIp"
Write-Host "SecurityGroupId: $sgId"
Write-Host "AllocationId: $allocationId"
