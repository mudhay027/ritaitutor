@echo off
echo === Rebuilding FAISS Index ===
echo.

cd ..\indexer

echo [1/2] Checking for Python dependencies...
pip show sentence-transformers >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo [2/2] Running build_index.py...
python build_index.py

echo.
echo Done! Check if pdf_index.faiss was created in data/config/
echo.
pause
