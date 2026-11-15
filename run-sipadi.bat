@echo off
title SIPADI - Full Stack Runner
echo ========================================================
echo        MEMULAI SISTEM CERDAS SIPADI (AI & ML)
echo ========================================================
echo.

echo [1/3] Menjalankan Backend FastAPI di port 8000...
start "SIPADI Backend (FastAPI)" cmd /k "py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Menjalankan Frontend Vite di port 5173...
start "SIPADI Frontend (Vite)" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Menjalankan Ngrok Tunnel (Domain Publik)...
start "SIPADI Ngrok Tunnel" cmd /k "ngrok http 5173 --url https://flaxseed-corny-audible.ngrok-free.dev"

echo.
echo ========================================================
echo Sistem SIPADI berhasil dijalankan secara lengkap!
echo - Akses Lokal      : http://localhost:5173
echo - Akses Publik     : https://flaxseed-corny-audible.ngrok-free.dev
echo - Dokumentasi API  : http://localhost:8000/docs
echo ========================================================
echo.
pause
