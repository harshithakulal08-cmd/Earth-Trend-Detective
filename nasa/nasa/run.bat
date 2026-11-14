@echo off
echo Starting NASA Data Detectives...

set PYTHON_EXE=C:\Users\Hp\AppData\Local\Python\pythoncore-3.14-64\python.exe
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo Starting Backend on http://127.0.0.1:8000 ...
start "NASA Backend" cmd /k "cd /d %~dp0backend && \"%PYTHON_EXE%\" -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload"

echo Starting Frontend on http://127.0.0.1:5173 ...
start "NASA Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Application launched!
echo Frontend: http://127.0.0.1:5173
echo Backend API Docs: http://127.0.0.1:8000/docs

