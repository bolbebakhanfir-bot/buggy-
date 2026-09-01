@echo off
REM One-command setup + launch for the Meryal Buggy Daily Tracking System.
REM Installs dependencies (first run only), builds the client, and starts
REM the server on http://localhost:4000.
cd /d "%~dp0"

echo ==^> Setting up server...
cd server
if not exist node_modules (call npm install)
cd ..

echo ==^> Setting up client...
cd client
if not exist node_modules (call npm install)
call npm run build
cd ..

echo ==^> Starting app on http://localhost:4000  (Ctrl+C to stop)
cd server
call npm start
