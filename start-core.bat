@echo off
title CropDeal Platform - Core Services Launcher (Lightweight)
color 0B
echo ========================================================
echo     CROPDEAL PLATFORM - CORE SERVICES LAUNCHER (FAST)  
echo ========================================================
echo.

cd /d "D:\cropdealnaresh"

echo [1/3] Starting Eureka Discovery Server [8761]...
start "Eureka Server [8761]" cmd /k "cd /d D:\cropdealnaresh\eureka-server && ..\mvnw.cmd spring-boot:run"

echo Waiting 12 seconds for Eureka...
timeout /t 12 /nobreak >nul

echo [2/3] Starting Essential Services (Auth, Crop, Price, Order, Chatbot)...
start "Auth Service [8081]" cmd /k "cd /d D:\cropdealnaresh\auth-service && ..\mvnw.cmd spring-boot:run"
start "Crop Service [8083]" cmd /k "cd /d D:\cropdealnaresh\crop-service && ..\mvnw.cmd spring-boot:run"
start "Price Service [8084]" cmd /k "cd /d D:\cropdealnaresh\price-service && ..\mvnw.cmd spring-boot:run"
start "Order Service [8088]" cmd /k "cd /d D:\cropdealnaresh\order-service && ..\mvnw.cmd spring-boot:run"
start "Chatbot Service [8096]" cmd /k "cd /d D:\cropdealnaresh\chatbot-service && ..\mvnw.cmd spring-boot:run"

echo Waiting 10 seconds for services to register...
timeout /t 10 /nobreak >nul

start "API Gateway [8080]" cmd /k "cd /d D:\cropdealnaresh\api-gateway && ..\mvnw.cmd spring-boot:run"

echo [3/3] Starting Angular Frontend [4200]...
start "CropDeal Frontend [4200]" cmd /k "cd /d D:\cropdealnaresh\cropdeal-ui && npm start"

echo.
echo ========================================================
echo Core CropDeal platform services launched!
echo Access UI: http://localhost:4200
echo ========================================================
pause
