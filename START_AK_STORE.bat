@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ==========================================
echo AK STORE - LOCAL START
echo ==========================================
echo.

if not exist "venv\Scripts\python.exe" (
  echo Missing Python virtual environment at venv\Scripts\python.exe
  echo Create or restore the venv before starting the project.
  pause
  exit /b 1
)

if not exist "front-web\package.json" (
  echo Missing frontend app at front-web\package.json
  pause
  exit /b 1
)

echo Starting backend on http://localhost:8000
start "AK Store Backend" cmd /k "cd /d %ROOT% && venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting frontend on http://localhost:5173
start "AK Store Frontend" cmd /k "cd /d %ROOT%front-web && npm.cmd run dev:frontend"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Health:   http://localhost:8000/api/health
echo.
echo Admin Login: 9999999999 / admin123
echo Executive Login: 8888888888 / exec123
echo Customer Login: 8210282102 / aditya123
echo.
echo Keep both new terminal windows open while testing locally.
pause
