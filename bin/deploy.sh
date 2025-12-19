#!/bin/bash
set -e

echo "🚀 Apex AI Insights: One-Click Deployment"
echo "----------------------------------------"

# 1. Dependency Check
echo "🔍 Checking dependencies..."
command -v go >/dev/null 2>&1 || { echo >&2 "Go is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "Node.js is required but not installed. Aborting."; exit 1; }

# 2. Build Frontend
echo "📦 Building Dashboard UI..."
cd dashboard-ui
npm install
npm run build
cd ..

# 3. Build Go Engine
echo "⚙️  Building Go Engine..."
cd engine-go
go mod tidy
# -ldflags="-s -w" strips debug info for smaller binary
go build -ldflags="-s -w" -o ../bin/apex-engine .
cd ..

# 4. Preparing Assets
echo "🎨 Preparing Static Assets..."
# Copy build files to engine's public dir if needed, or ensuring mapping
# For this setup, we assume engine serves static files or Nginx does. 
# We'll create a 'dist' folder structure for the final release.

mkdir -p dist/
cp bin/apex-engine dist/
cp -r dashboard-ui/dist dist/public
cp -r engine-go/data dist/data
cp .env.example dist/.env

echo "✅ Build Complete!"
echo "📂 Distribution artifacts are in 'dist/'"
echo ""
echo "To run:"
echo "  cd dist && ./apex-engine"
