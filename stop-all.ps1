# CropDeal Platform - PowerShell Master Stop Script
Write-Host "========================================================" -ForegroundColor Red
Write-Host "         STOPPING ALL CROPDEAL SERVICES & FRONTEND      " -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red

Write-Host "`nTerminating running Java microservices..." -ForegroundColor Yellow
$javaProcs = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcs) {
    $javaProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Stopped $($javaProcs.Count) Java processes." -ForegroundColor Green
} else {
    Write-Host "[INFO] No running Java processes found." -ForegroundColor Gray
}

Write-Host "`nTerminating Angular frontend Node processes..." -ForegroundColor Yellow
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Stopped $($nodeProcs.Count) Node processes." -ForegroundColor Green
} else {
    Write-Host "[INFO] No running Node processes found." -ForegroundColor Gray
}

Write-Host "`nFreeing any residual network ports..." -ForegroundColor Yellow
$ports = 4200,8080,8761,8888,8081,8082,8083,8084,8085,8086,8087,8088,8089,8090,8091,8092,8094,8095,8096
$connections = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "[COMPLETED] All CropDeal services and ports are now stopped!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
