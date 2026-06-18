$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TongXiao - Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- Python virtual environment ---
$venvPath = Join-Path $root ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[1/3] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment. Make sure Python is installed." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "[1/3] Virtual environment already exists, skipping." -ForegroundColor Green
}

# --- Install Python dependencies ---
Write-Host "[2/3] Installing Python dependencies..." -ForegroundColor Yellow
$pip = Join-Path $venvPath "Scripts\pip.exe"
& $pip install -r (Join-Path $root "backend\requirements.txt") --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip install failed." -ForegroundColor Red
    exit 1
}

# --- Install frontend dependencies ---
$frontendPath = Join-Path $root "frontend"
if (Test-Path (Join-Path $frontendPath "package.json")) {
    Write-Host "[3/3] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    try {
        npm install --silent
    }
    finally {
        Pop-Location
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: npm install failed. You can run it manually later." -ForegroundColor Yellow
    }
}
else {
    Write-Host "[3/3] No frontend package.json, skipping." -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "  Run the backend: .venv\Scripts\python.exe run.py" -ForegroundColor White
Write-Host "  Run the frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
