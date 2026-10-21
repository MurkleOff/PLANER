@echo off
set "PATH=D:\PROGRAMS;C:\Program Files\Git\cmd;%PATH%"
cd /d "%~dp0"
echo Step 1: Login to Vercel...
call "D:\PROGRAMS\npx.cmd" vercel login
echo.
echo Step 2: Deploying to Vercel Production...
call "D:\PROGRAMS\npx.cmd" vercel --prod
pause
