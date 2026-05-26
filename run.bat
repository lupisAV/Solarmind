@echo off
echo =====================================
echo   Solarmind Analytics - Iniciando
echo =====================================
echo.
echo Instalando dependencias Python...
pip install -r backend/requirements.txt
echo.
echo Generando dataset...
python backend/generate_dataset.py
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
