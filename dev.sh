#!/bin/bash

echo "Starting MCP SSH Server in development mode..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if TypeScript is built
if [ ! -d "dist" ]; then
    echo "Building TypeScript files..."
    npm run build
    echo ""
fi

# Start the server
echo "Starting server..."
npm run dev
