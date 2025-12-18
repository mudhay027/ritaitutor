@echo off
echo Starting AI Tutor System...

REM Check for .NET
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: .NET SDK not found. Please install .NET 8.0 or later.
    pause
    exit /b
)

REM Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python not found. Please install Python 3.10 or later.
    pause
    exit /b
)

REM Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js.
    pause
    exit /b
)

echo.
echo [1/3] Starting Indexer Service (Port 8001)...
start "AI Tutor Indexer" cmd /k "cd ..\indexer && pip install -r requirements.txt && python app.py"

echo.
echo [2/3] Starting Backend API (Port 5000)...
REM Set INDEXER_DATA_DIR to point to the indexer/data folder
set "INDEXER_DATA_DIR=%~dp0..\indexer\data"
start "AI Tutor Backend" cmd /k "cd ..\backend\FinalYearAPI && dotnet run --urls=http://localhost:5000"

echo.
echo [3/3] Starting Frontend (Port 5173)...
start "AI Tutor Frontend" cmd /k "cd ..\frontend && npm install && npm run dev"

echo.
echo All services started! 
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000/swagger
echo Indexer: http://localhost:8001/docs
echo.
echo Press any key to close this launcher (services will keep running)...
pause >nul
