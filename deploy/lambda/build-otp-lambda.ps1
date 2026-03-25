param(
  [string]$OutputZip = "deploy\lambda\otp_sender.zip"
)

$ErrorActionPreference = "Stop"

if (Test-Path $OutputZip) {
  Remove-Item $OutputZip -Force
}

Compress-Archive -Path .\deploy\lambda\otp_sender.py -DestinationPath $OutputZip -Force
