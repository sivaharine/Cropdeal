@echo off
title CropDeal Platform - Stop All Services
color 0C
echo ========================================================
echo         STOPPING ALL CROPDEAL SERVICES & FRONTEND      
echo ========================================================
echo.

echo Terminating running Java microservice processes...
taskkill /F /IM java.exe /T 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] All Java microservices stopped.
) else (
    echo [INFO] No running Java services found.
)

echo Terminating Angular frontend node processes...
taskkill /F /IM node.exe /T 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Angular frontend server stopped.
) else (
    echo [INFO] No running Node processes found.
)

echo.
echo Freeing any remaining CropDeal ports (4200, 8080, 8761, 8888, 8081-8096)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4200,8080,8761,8888,8081,8082,8083,8084,8085,8086,8087,8088,8089,8090,8091,8092,8094,8095,8096 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo ========================================================
echo [COMPLETED] All CropDeal services and frontend are stopped!
echo ========================================================
pause
