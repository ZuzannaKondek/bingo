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
echo "Next steps:"
echo "  1. Commit the built files (or add backend/static/ to .gitignore if building on server)"
echo "  2. Deploy to server via git"
echo "  3. Run: /usr/local/bin/python3.11 backend/run.py"
