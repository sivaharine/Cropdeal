Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Starting CropDeal Microservices Ecosystem (17 Services)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$root = $PSScriptRoot
$env:DB_HOST = "localhost"
$env:DB_PORT = "3307"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "2912"

function Start-DockerInfrastructure($serviceName, $displayName, $url) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($null -eq $docker) {
        Write-Host "$displayName was not started because Docker is not installed or not in PATH." -ForegroundColor Red
        Write-Host "Install/start Docker Desktop, then run: docker compose up -d $serviceName" -ForegroundColor Yellow
        return
    }

    Write-Host "Starting $displayName..." -ForegroundColor Cyan
    Push-Location $root
    try {
        docker compose up -d $serviceName
    } finally {
        Pop-Location
    }

    Write-Host "$displayName URL: $url" -ForegroundColor Cyan
}

function Start-Microservice($name, $jarPath, $port) {
    Write-Host "Starting $name on port $port..." -ForegroundColor Cyan
    Start-Process cmd.exe -ArgumentList "/k title $name - $port && java -jar `"$jarPath`""
}

# Infrastructure needed by database-backed and event-driven services.
Start-DockerInfrastructure "mysql" "MySQL" "localhost:3307"
Write-Host "MySQL login: root / 2912" -ForegroundColor Cyan
Write-Host "Waiting 25 seconds for MySQL to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 25

Start-DockerInfrastructure "rabbitmq" "RabbitMQ" "http://localhost:15672"
Write-Host "RabbitMQ login: guest / guest" -ForegroundColor Cyan
Write-Host "Waiting 10 seconds for RabbitMQ to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 1. Config Server
Start-Microservice "Config-Server" "$root\config-server\target\config-server-1.0.0.jar" 8888
Write-Host "Waiting 12 seconds for Config Server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# 2. Eureka Server
Start-Microservice "Eureka-Server" "$root\eureka-server\target\eureka-server-1.0.0.jar" 8761
Write-Host "Waiting 15 seconds for Eureka Server to register..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 3. API Gateway
Start-Microservice "API-Gateway" "$root\api-gateway\target\api-gateway-1.0.0.jar" 8080
Start-Sleep -Seconds 5

# 4. Auth & User Services
Start-Microservice "Auth-Service" "$root\auth-service\target\auth-service-1.0.0.jar" 8081
Start-Microservice "User-Service" "$root\user-service\target\user-service-1.0.0.jar" 8082
Start-Sleep -Seconds 5

# 5. Core Domain & Business Services
Start-Microservice "Price-Service" "$root\price-service\target\price-service-1.0.0.jar" 8083
Start-Microservice "Crop-Service" "$root\crop-service\target\crop-service-1.0.0.jar" 8087
Start-Microservice "Negotiation-Service" "$root\negotiation-service\target\negotiation-service-1.0.0.jar" 8091
Start-Microservice "Bidding-Service" "$root\bidding-service\target\bidding-service-1.0.0.jar" 8095
Start-Microservice "Order-Service" "$root\order-service\target\order-service-1.0.0.jar" 8085
Start-Microservice "Payment-Service" "$root\payment-service\target\payment-service-1.0.0.jar" 8086
Start-Microservice "Delivery-Service" "$root\delivery-service\target\delivery-service-1.0.0.jar" 8090
Start-Microservice "Review-Service" "$root\review-service\target\review-service-1.0.0.jar" 8094
Start-Microservice "Invoice-Service" "$root\invoice-service\target\invoice-service-1.0.0.jar" 8089
Start-Microservice "Notification-Service" "$root\notification-service\target\notification-service-1.0.0.jar" 8093
Start-Microservice "Admin-Report-Service" "$root\admin-dashboard-report-service\target\admin-dashboard-report-service-1.0.0.jar" 8092
Start-Microservice "Chatbot-Service" "$root\chatbot-service\target\chatbot-service-1.0.0.jar" 8088

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "All 17 microservices successfully launched!" -ForegroundColor Green
Write-Host "Eureka Dashboard:   http://localhost:8761" -ForegroundColor Cyan
Write-Host "API Gateway:        http://localhost:8080" -ForegroundColor Cyan
Write-Host "Swagger UI:         http://localhost:8080/swagger-ui.html" -ForegroundColor Cyan
Write-Host "RabbitMQ Dashboard: http://localhost:15672" -ForegroundColor Cyan
Write-Host "RabbitMQ Login:     guest / guest" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
