$PythonExe = "C:\Users\Hp\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting NASA Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\backend'; & '$PythonExe' -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload"

Write-Host "Starting NASA Frontend on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir\frontend'; npm run dev"

Write-Host "Application launched!" -ForegroundColor Green
Write-Host "Frontend:        http://127.0.0.1:5173" -ForegroundColor Yellow
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow

