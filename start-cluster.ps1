# CropDeal Microservices Cluster Runner
$ErrorActionPreference = "Continue"

$services = @(
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

$procs = @()

foreach ($svc in $services) {
    $jarPath = Join-Path $svc.Dir $svc.Jar
    Write-Host "[LAUNCHING] $($svc.Name) on port $($svc.Port)..." -ForegroundColor Cyan
    $p = Start-Process -FilePath "java" `
        -ArgumentList "-Xms48m -Xmx130m -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -jar `"$jarPath`"" `
        -WorkingDirectory $svc.Dir `
        -PassThru
    $procs += $p
    Start-Sleep -Seconds 2
}

Write-Host "`nAll 14 business microservices launched! Total child processes: $($procs.Count)" -ForegroundColor Green

while ($true) {
    Start-Sleep -Seconds 30
}
