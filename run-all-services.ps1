# CropDeal Platform - Background Daemon Master Launcher
$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "       CROPDEAL PLATFORM - FULL CLUSTER DAEMON          " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Set-Location -Path "D:\cropdealnaresh"

if (-not (Test-Path "D:\cropdealnaresh\logs")) {
    New-Item -ItemType Directory -Path "D:\cropdealnaresh\logs" -Force | Out-Null
}

$javaArgs = "-Xms32m -Xmx130m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
$procs = @()

# 1. Eureka Server & Config Server
Write-Host "`n[1/4] Launching Eureka Server [8761] and Config Server [8888]..." -ForegroundColor Cyan
$pEureka = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c java $javaArgs -jar target\eureka-server-1.0.0.jar > D:\cropdealnaresh\logs\eureka-server.log 2>&1" `
    -WorkingDirectory "D:\cropdealnaresh\eureka-server" `
    -PassThru
$procs += $pEureka

$pConfig = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c java $javaArgs -jar target\config-server-1.0.0.jar > D:\cropdealnaresh\logs\config-server.log 2>&1" `
    -WorkingDirectory "D:\cropdealnaresh\config-server" `
    -PassThru
$procs += $pConfig

Write-Host "Waiting 18 seconds for Eureka and Config Server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 18

# 2. Business Microservices
Write-Host "`n[2/4] Launching 15 Business Microservices..." -ForegroundColor Cyan
$services = @(
    @{ Name="auth-service"; Dir="D:\cropdealnaresh\auth-service"; Jar="target\auth-service-1.0.0.jar"; Port=8081 },
    @{ Name="user-service"; Dir="D:\cropdealnaresh\user-sevice"; Jar="target\user-service-1.0.0.jar"; Port=8082 },
    @{ Name="crop-service"; Dir="D:\cropdealnaresh\crop-service"; Jar="target\crop-service-1.0.0.jar"; Port=8083 },
    @{ Name="price-service"; Dir="D:\cropdealnaresh\price-service"; Jar="target\price-service-1.0.0.jar"; Port=8084 },
    @{ Name="negotiation-service"; Dir="D:\cropdealnaresh\negotiation-service"; Jar="target\negotiation-service-1.0.0.jar"; Port=8085 },
    @{ Name="bidding-service"; Dir="D:\cropdealnaresh\bidding-service"; Jar="target\bidding-service-1.0.0.jar"; Port=8086 },
    @{ Name="wallet-service"; Dir="D:\cropdealnaresh\wallet-service"; Jar="target\wallet-service-1.0.0.jar"; Port=8087 },
    @{ Name="order-service"; Dir="D:\cropdealnaresh\order-service"; Jar="target\order-service-1.0.0.jar"; Port=8088 },
    @{ Name="payment-service"; Dir="D:\cropdealnaresh\payment-service"; Jar="target\payment-service-1.0.0.jar"; Port=8089 },
    @{ Name="invoice-service"; Dir="D:\cropdealnaresh\invoice-service"; Jar="target\invoice-service-1.0.0.jar"; Port=8090 },
    @{ Name="delivery-service"; Dir="D:\cropdealnaresh\deliveryservice"; Jar="target\delivery-service-1.0.0.jar"; Port=8091 },
    @{ Name="notification-service"; Dir="D:\cropdealnaresh\notification-service"; Jar="target\notification-service-1.0.0.jar"; Port=8092 },
    @{ Name="price-alert-service"; Dir="D:\cropdealnaresh\price-alert-service"; Jar="target\price-alert-service-1.0.0.jar"; Port=8094 },
    @{ Name="report-service"; Dir="D:\cropdealnaresh\report-service"; Jar="target\report-service-1.0.0.jar"; Port=8095 },
    @{ Name="chatbot-service"; Dir="D:\cropdealnaresh\chatbot-service"; Jar="target\chatbot-service-1.0.0.jar"; Port=8096 }
)

foreach ($svc in $services) {
    Write-Host "  -> Launching $($svc.Name) on port $($svc.Port)..." -ForegroundColor Gray
    $p = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c java $javaArgs -jar $($svc.Jar) > D:\cropdealnaresh\logs\$($svc.Name).log 2>&1" `
        -WorkingDirectory $svc.Dir `
        -PassThru
    $procs += $p
    Start-Sleep -Milliseconds 500
}

Write-Host "`nWaiting 14 seconds for microservices to register with Eureka..." -ForegroundColor Yellow
Start-Sleep -Seconds 14

# 3. API Gateway
Write-Host "`n[3/4] Launching API Gateway [8080]..." -ForegroundColor Cyan
$pGateway = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c java $javaArgs -jar target\api-gateway-1.0.0.jar > D:\cropdealnaresh\logs\api-gateway.log 2>&1" `
    -WorkingDirectory "D:\cropdealnaresh\api-gateway" `
    -PassThru
$procs += $pGateway

# 4. Angular Frontend
Write-Host "`n[4/4] Launching Angular Frontend [4200]..." -ForegroundColor Cyan
$pUi = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm start > D:\cropdealnaresh\logs\cropdeal-ui.log 2>&1" `
    -WorkingDirectory "D:\cropdealnaresh\cropdeal-ui" `
    -PassThru
$procs += $pUi

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "All CropDeal Services and Frontend UI are active!" -ForegroundColor Green
Write-Host "  - Frontend UI:      http://localhost:4200" -ForegroundColor Yellow
Write-Host "  - API Gateway:      http://localhost:8080" -ForegroundColor Yellow
Write-Host "  - Eureka Server:    http://localhost:8761" -ForegroundColor Yellow
Write-Host "  - Swagger UI:       http://localhost:8080/swagger-ui.html" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green

Write-Host "All background processes are running and logging to D:\cropdealnaresh\logs" -ForegroundColor Cyan
Write-Host "To stop all services, run: .\stop-all.ps1" -ForegroundColor Yellow

# Daemon keepalive loop
while ($true) {
    Start-Sleep -Seconds 30
}
