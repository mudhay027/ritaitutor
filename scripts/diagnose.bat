@echo off
echo === AI Tutor System Diagnostic ===
echo.

echo [1/7] Checking if indexer data folders exist...
if exist "..\indexer\data\staff_pdfs" (
    echo ✓ staff_pdfs folder exists
    dir /b "..\indexer\data\staff_pdfs\*.pdf" 2>nul
    if %errorlevel% == 0 (
        echo ✓ Found PDF files:
        dir /b "..\indexer\data\staff_pdfs\*.pdf"
    ) else (
        echo ⚠ No PDF files found in staff_pdfs folder!
    )
) else (
    echo ✗ staff_pdfs folder does NOT exist!
    echo Creating folder...
    mkdir "..\indexer\data\staff_pdfs"
)

echo.
echo [2/7] Checking if config folder exists...
if exist "..\indexer\data\config" (
    echo ✓ config folder exists
) else (
    echo ✗ config folder does NOT exist!
    echo Creating folder...
    mkdir "..\indexer\data\config"
)

echo.
echo [3/7] Checking if FAISS index exists...
if exist "..\indexer\data\config\pdf_index.faiss" (
    echo ✓ FAISS index exists
) else (
    echo ⚠ FAISS index NOT found! You need to upload a PDF or rebuild the index.
)

echo.
echo [4/7] Checking if Indexer service is running...
curl -s http://localhost:8001/status >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Indexer is running
    curl http://localhost:8001/status
) else (
    echo ✗ Indexer is NOT running on port 8001!
    echo Please start the indexer with: cd ..\indexer ^&^& python app.py
)

echo.
echo [5/7] Checking if Backend is running...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Backend is running
) else (
    echo ✗ Backend is NOT running on port 5000!
)

echo.
echo [6/7] Checking if Frontend is running...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Frontend is running
) else (
    echo ⚠ Frontend is NOT running on port 5173!
)

echo.
echo [7/7] Checking MySQL...
echo (Skipped - requires mysql command)

echo.
echo === Diagnostic Complete ===
echo.
echo If indexer is not running, start it with:
echo   cd ..\indexer
echo   pip install -r requirements.txt
echo   python app.py
echo.
pause
