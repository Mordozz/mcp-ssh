@echo off
echo Starting MCP SSH Server in development mode...
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

:: Check if TypeScript is built
if not exist "dist" (
    echo Building TypeScript files...
    call npm run build
    echo.
)

:: Start the server
echo Starting server...
npm run dev
