# CropDeal Platform - PowerShell Master Startup Script
Write-Host "========================================================" -ForegroundColor Green
Write-Host "        CROPDEAL PLATFORM - FULL SYSTEM LAUNCHER        " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Set-Location -Path "D:\cropdealnaresh"

$javaArgs = "-Xms32m -Xmx120m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

Write-Host "`n[1/4] Starting Service Discovery & Central Configuration..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k ""title Eureka Server [8761] && cd /d D:\cropdealnaresh\eureka-server && java $javaArgs -jar target\eureka-server-1.0.0.jar"""
Start-Process cmd -ArgumentList "/k ""title Config Server [8888] && cd /d D:\cropdealnaresh\config-server && java $javaArgs -jar target\config-server-1.0.0.jar"""

Write-Host "Waiting 15 seconds for Eureka and Config Server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n[2/4] Starting Business Microservices..." -ForegroundColor Cyan
$services = @(
    @{ Name="Auth Service [8081]"; Dir="auth-service"; Jar="target\auth-service-1.0.0.jar" },
    @{ Name="User Service [8082]"; Dir="user-sevice"; Jar="target\user-service-1.0.0.jar" },
    @{ Name="Crop Service [8083]"; Dir="crop-service"; Jar="target\crop-service-1.0.0.jar" },
    @{ Name="Price Service [8084]"; Dir="price-service"; Jar="target\price-service-1.0.0.jar" },
    @{ Name="Negotiation Service [8085]"; Dir="negotiation-service"; Jar="target\negotiation-service-1.0.0.jar" },
    @{ Name="Bidding Service [8086]"; Dir="bidding-service"; Jar="target\bidding-service-1.0.0.jar" },
    @{ Name="Wallet Service [8087]"; Dir="wallet-service"; Jar="target\wallet-service-1.0.0.jar" },
    @{ Name="Order Service [8088]"; Dir="order-service"; Jar="target\order-service-1.0.0.jar" },
    @{ Name="Payment Service [8089]"; Dir="payment-service"; Jar="target\payment-service-1.0.0.jar" },
    @{ Name="Invoice Service [8090]"; Dir="invoice-service"; Jar="target\invoice-service-1.0.0.jar" },
    @{ Name="Delivery Service [8091]"; Dir="deliveryservice"; Jar="target\delivery-service-1.0.0.jar" },
    @{ Name="Notification Service [8092]"; Dir="notification-service"; Jar="target\notification-service-1.0.0.jar" },
    @{ Name="Price Alert Service [8094]"; Dir="price-alert-service"; Jar="target\price-alert-service-1.0.0.jar" },
    @{ Name="Report Service [8095]"; Dir="report-service"; Jar="target\report-service-1.0.0.jar" },
    @{ Name="Chatbot Service [8096]"; Dir="chatbot-service"; Jar="target\chatbot-service-1.0.0.jar" }
)

foreach ($svc in $services) {
    Write-Host "  -> Launching $($svc.Name)..." -ForegroundColor Gray
    Start-Process cmd -ArgumentList "/k ""title $($svc.Name) && cd /d D:\cropdealnaresh\$($svc.Dir) && java $javaArgs -jar $($svc.Jar)"""
    Start-Sleep -Milliseconds 600
}

Write-Host "`nWaiting 10 seconds for microservices to register with Eureka..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n[3/4] Starting API Gateway [8080]..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k ""title API Gateway [8080] && cd /d D:\cropdealnaresh\api-gateway && java $javaArgs -jar target\api-gateway-1.0.0.jar"""

Write-Host "`n[4/4] Starting Angular Frontend [4200]..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList '/k "title CropDeal UI [4200] && cd /d D:\cropdealnaresh\cropdeal-ui && npm start"'

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "All CropDeal services have been launched!" -ForegroundColor Green
Write-Host "Access URLs:" -ForegroundColor White
Write-Host "  - Frontend UI:         http://localhost:4200" -ForegroundColor Yellow
Write-Host "  - API Gateway:         http://localhost:8080" -ForegroundColor Yellow
Write-Host "  - Eureka Dashboard:    http://localhost:8761" -ForegroundColor Yellow
Write-Host "  - Swagger API Docs:    http://localhost:8080/swagger-ui.html" -ForegroundColor Yellow
Write-Host "`nTo STOP all services, run: .\stop-all.ps1 or double-click stop-all.bat" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
