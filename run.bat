@echo off
cd /d "%~dp0"

if not exist "data" mkdir "data"

echo =====================================
echo   Solarmind Analytics - Iniciando
echo =====================================
echo.
echo Instalando dependencias Python...
pip install -r backend/requirements.txt
echo.
echo Construyendo frontend...
cd frontend
call npm install
call npm run build
cd ..
echo.
echo Iniciando servidor en http://localhost:8000
python backend/app.py
pause
