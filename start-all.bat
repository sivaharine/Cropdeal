@echo off
title CropDeal Platform - Master Startup
color 0A
echo ========================================================
echo         CROPDEAL PLATFORM - FULL SYSTEM LAUNCHER       
echo ========================================================
echo.

cd /d "D:\cropdealnaresh"

set JAVA_OPTS=-Xms32m -Xmx120m -XX:+TieredCompilation -XX:TieredStopAtLevel=1

echo [1/4] Starting Service Discovery & Central Configuration...
start "Eureka Server [8761]" cmd /k "title Eureka Server [8761] && cd /d D:\cropdealnaresh\eureka-server && java %JAVA_OPTS% -jar target\eureka-server-1.0.0.jar"
start "Config Server [8888]" cmd /k "title Config Server [8888] && cd /d D:\cropdealnaresh\config-server && java %JAVA_OPTS% -jar target\config-server-1.0.0.jar"

echo Waiting 15 seconds for Eureka Server and Config Server to initialize...
timeout /t 15 /nobreak >nul

echo [2/4] Starting Business Microservices...
start "Auth Service [8081]" cmd /k "title Auth Service [8081] && cd /d D:\cropdealnaresh\auth-service && java %JAVA_OPTS% -jar target\auth-service-1.0.0.jar"
start "User Service [8082]" cmd /k "title User Service [8082] && cd /d D:\cropdealnaresh\user-sevice && java %JAVA_OPTS% -jar target\user-service-1.0.0.jar"
start "Crop Service [8083]" cmd /k "title Crop Service [8083] && cd /d D:\cropdealnaresh\crop-service && java %JAVA_OPTS% -jar target\crop-service-1.0.0.jar"
start "Price Service [8084]" cmd /k "title Price Service [8084] && cd /d D:\cropdealnaresh\price-service && java %JAVA_OPTS% -jar target\price-service-1.0.0.jar"
start "Negotiation Service [8085]" cmd /k "title Negotiation Service [8085] && cd /d D:\cropdealnaresh\negotiation-service && java %JAVA_OPTS% -jar target\negotiation-service-1.0.0.jar"
start "Bidding Service [8086]" cmd /k "title Bidding Service [8086] && cd /d D:\cropdealnaresh\bidding-service && java %JAVA_OPTS% -jar target\bidding-service-1.0.0.jar"
start "Wallet Service [8087]" cmd /k "title Wallet Service [8087] && cd /d D:\cropdealnaresh\wallet-service && java %JAVA_OPTS% -jar target\wallet-service-1.0.0.jar"
start "Order Service [8088]" cmd /k "title Order Service [8088] && cd /d D:\cropdealnaresh\order-service && java %JAVA_OPTS% -jar target\order-service-1.0.0.jar"
start "Payment Service [8089]" cmd /k "title Payment Service [8089] && cd /d D:\cropdealnaresh\payment-service && java %JAVA_OPTS% -jar target\payment-service-1.0.0.jar"
start "Invoice Service [8090]" cmd /k "title Invoice Service [8090] && cd /d D:\cropdealnaresh\invoice-service && java %JAVA_OPTS% -jar target\invoice-service-1.0.0.jar"
start "Delivery Service [8091]" cmd /k "title Delivery Service [8091] && cd /d D:\cropdealnaresh\deliveryservice && java %JAVA_OPTS% -jar target\delivery-service-1.0.0.jar"
start "Notification Service [8092]" cmd /k "title Notification Service [8092] && cd /d D:\cropdealnaresh\notification-service && java %JAVA_OPTS% -jar target\notification-service-1.0.0.jar"
start "Price Alert Service [8094]" cmd /k "title Price Alert Service [8094] && cd /d D:\cropdealnaresh\price-alert-service && java %JAVA_OPTS% -jar target\price-alert-service-1.0.0.jar"
start "Report Service [8095]" cmd /k "title Report Service [8095] && cd /d D:\cropdealnaresh\report-service && java %JAVA_OPTS% -jar target\report-service-1.0.0.jar"
start "Chatbot Service [8096]" cmd /k "title Chatbot Service [8096] && cd /d D:\cropdealnaresh\chatbot-service && java %JAVA_OPTS% -jar target\chatbot-service-1.0.0.jar"

echo Waiting 12 seconds for microservices to register with Eureka...
timeout /t 12 /nobreak >nul

echo [3/4] Starting API Gateway [8080]...
start "API Gateway [8080]" cmd /k "title API Gateway [8080] && cd /d D:\cropdealnaresh\api-gateway && java %JAVA_OPTS% -jar target\api-gateway-1.0.0.jar"

echo [4/4] Starting Angular Frontend [4200]...
start "CropDeal Frontend [4200]" cmd /k "title CropDeal Frontend [4200] && cd /d D:\cropdealnaresh\cropdeal-ui && npm start"

echo.
echo ========================================================
echo All CropDeal services have been launched!
echo.
echo Access URLs:
echo   - Frontend UI:         http://localhost:4200
echo   - API Gateway:         http://localhost:8080
echo   - Eureka Dashboard:    http://localhost:8761
echo   - Swagger API Docs:    http://localhost:8080/swagger-ui.html
echo.
echo To STOP all services at any time, run: D:\cropdealnaresh\stop-all.bat
echo ========================================================
pause
