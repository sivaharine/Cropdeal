Write-Host "Stopping all CropDeal Java processes..." -ForegroundColor Yellow
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "All CropDeal services stopped." -ForegroundColor Green