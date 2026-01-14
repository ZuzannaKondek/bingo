#!/bin/bash

# Build script for Bingo application
# This script builds the frontend and prepares it for deployment

set -e  # Exit on error

echo "Building Bingo application..."

# Check if we're in the project root
if [ ! -f "frontend/package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to build the frontend."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to build the frontend."
    exit 1
fi

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

# Verify build output
if [ ! -d "../backend/static" ]; then
    echo "Error: Build output directory not found at backend/static"
    exit 1
fi

if [ ! -f "../backend/static/index.html" ]; then
    echo "Error: index.html not found in build output"
    exit 1
fi

echo "Build completed successfully!"
echo "Frontend files are in: backend/static/"
echo ""
echo "IMPORTANT: Since Node.js is not available on the server, you MUST commit these built files:"
echo ""
echo "Next steps:"
echo "  1. Review the built files: git status backend/static/"
echo "  2. Add and commit the built files:"
echo "     git add backend/static/"
echo "     git commit -m 'Build frontend for deployment'"
echo "  3. Push to repository: git push"
echo "  4. On server, pull the changes: git pull"
echo "  5. Run: /usr/local/bin/python3.11 backend/run.py"
