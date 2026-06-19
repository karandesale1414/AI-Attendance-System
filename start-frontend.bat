@echo off
echo Starting React Frontend...
cd /d "c:\Users\karan\OneDrive\Desktop\attend ai\frontend"
echo Current directory: %CD%
echo.
echo Installing dependencies...
npm install
echo.
echo Starting React development server on http://localhost:5173
echo Press CTRL+C to stop the server
echo.
npm run dev
pause
