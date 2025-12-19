#!/bin/bash
set -e

echo "🚀 Starting Apex AI Insights Build Pipeline..."

# 1. Clean previous builds
echo "🧹 Cleaning up..."
rm -rf build
rm -f apex-ai-insights.zip
mkdir -p build/apex-ai-insights/assets/dashboard
mkdir -p build/apex-ai-insights/bin

# 2. Build React Dashboard
echo "⚛️ Building React Dashboard..."
cd dashboard-ui
npm install
npm run build
# Assets are built directly to ../plugin-core/assets/dashboard via vite.config.ts
cd ..

# 3. Build Go Engine (Cross-compile for Linux/amd64 - common for Docker/Servers)
echo "🐹 Building Go Engine..."
cd engine-go
# Build for Linux (Production target)
GOOS=linux GOARCH=amd64 go build -o ../build/apex-ai-insights/bin/apex-engine-linux-amd64 .
# Build for Darwin (Mac) - useful for local dev distribution if needed, or skip to save space
# GOOS=darwin GOARCH=arm64 go build -o ../build/apex-ai-insights/bin/apex-engine-darwin-arm64 .
cd ..

# 4. Copy Plugin Core Files
echo "🐘 Copying PHP Core..."
cp -r plugin-core/* build/apex-ai-insights/
cp plugin-core/.htaccess build/apex-ai-insights/ 2>/dev/null || true

# 5. Create Distribution Zip
echo "📦 Zipping Release..."
cd build
zip -r ../apex-ai-insights.zip apex-ai-insights -x "*.git*" "*/.DS_Store"
cd ..

echo "✅ Build Complete! Release available at: apex-ai-insights.zip"
