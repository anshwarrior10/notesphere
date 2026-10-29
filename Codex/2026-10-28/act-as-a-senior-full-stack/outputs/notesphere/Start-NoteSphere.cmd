@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title NoteSphere - Local Student Workspace
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 LTS is required. Install it from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
node scripts/start-local.mjs
if errorlevel 1 (
  echo.
  echo NoteSphere could not start. Read the error above and see README.md.
  pause
)
endlocal
