@echo off
title CropDeal Stopper
powershell -NoProfile -ExecutionPolicy Bypass -File %~dp0stop_cropdeal_all.ps1
pause
