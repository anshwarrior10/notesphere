@echo off
setlocal
title Open NoteSphere
set "NS_START_FILE=%~dp0notesphere\Start-NoteSphere.cmd"
if not exist "%NS_START_FILE%" set "NS_START_FILE=C:\Users\harma\Documents\Codex\2026-10-28\act-as-a-senior-full-stack\outputs\notesphere\Start-NoteSphere.cmd"
if not exist "%NS_START_FILE%" (
  echo NoteSphere's application folder could not be found.
  echo Keep this file beside the notesphere folder after extracting the project ZIP.
  pause
  exit /b 1
)
call "%NS_START_FILE%"
exit /b %errorlevel%
