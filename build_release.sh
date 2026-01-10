#!/bin/bash
# =============================================================================
# Apex AI Insights - One-Click Release Build Script
# =============================================================================
# This script builds and packages the complete plugin for distribution:
#   1. Builds React dashboard (Vite production mode)
#   2. Compiles Go binary (Linux, stripped for smaller size)
#   3. Packages PHP, JS, and binary into apex-ai-insights.zip
#
# Usage: ./build_release.sh [--skip-npm] [--multi-arch]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

VERSION="1.0.0-beta"
BUILD_DATE=$(date +"%Y-%m-%d")

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Apex AI Insights - Release Build Pipeline v${VERSION}     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
SKIP_NPM=false
MULTI_ARCH=false
for arg in "$@"; do
    case $arg in
        --skip-npm) SKIP_NPM=true ;;
        --multi-arch) MULTI_ARCH=true ;;
    esac
done

# =============================================================================
# Step 1: Clean Previous Builds
# =============================================================================
echo -e "${YELLOW}🧹 Step 1/5: Cleaning previous builds...${NC}"
rm -rf build
rm -f apex-ai-insights.zip
mkdir -p build/apex-ai-insights/assets/dist
mkdir -p build/apex-ai-insights/bin

echo -e "${GREEN}   ✓ Clean complete${NC}"

# =============================================================================
# Step 2: Build React Dashboard (Vite Production)
# =============================================================================
echo -e "${YELLOW}⚛️  Step 2/5: Building React Dashboard...${NC}"

if [ "$SKIP_NPM" = false ]; then
    cd dashboard-ui
    
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install --silent
    fi
    
    echo "   Running Vite production build..."
    npm run build
    
    cd ..
    echo -e "${GREEN}   ✓ Dashboard build complete${NC}"
else
    echo -e "${YELLOW}   ⚠ Skipping npm build (--skip-npm flag)${NC}"
fi

# =============================================================================
# Step 3: Compile Go Binary (Optimized for Production)
# =============================================================================
echo -e "${YELLOW}🐹 Step 3/5: Compiling Go Engine...${NC}"

cd engine-go

# Build for Linux/amd64 (primary production target)
echo "   Building for Linux/amd64..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -X main.Version=${VERSION} -X main.BuildDate=${BUILD_DATE}" \
    -o ../build/apex-ai-insights/bin/apex-engine-linux-amd64 .

LINUX_SIZE=$(du -h ../build/apex-ai-insights/bin/apex-engine-linux-amd64 | cut -f1)
echo -e "${GREEN}   ✓ Linux/amd64 binary: ${LINUX_SIZE}${NC}"

# Optional: Build for multiple architectures
if [ "$MULTI_ARCH" = true ]; then
    echo "   Building for Linux/arm64..."
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build \
        -ldflags="-s -w -X main.Version=${VERSION} -X main.BuildDate=${BUILD_DATE}" \
        -o ../build/apex-ai-insights/bin/apex-engine-linux-arm64 .
    
    echo "   Building for Darwin/arm64 (Apple Silicon)..."
    CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build \
        -ldflags="-s -w -X main.Version=${VERSION} -X main.BuildDate=${BUILD_DATE}" \
        -o ../build/apex-ai-insights/bin/apex-engine-darwin-arm64 .
    
    echo -e "${GREEN}   ✓ Multi-arch builds complete${NC}"
fi

cd ..

# =============================================================================
# Step 4: Copy Plugin Core Files
# =============================================================================
echo -e "${YELLOW}🐘 Step 4/5: Copying PHP Core...${NC}"

# Copy all PHP files
cp -r plugin-core/* build/apex-ai-insights/

# Copy hidden files if they exist
cp plugin-core/.htaccess build/apex-ai-insights/ 2>/dev/null || true

# Copy Docker production config
cp docker-compose.prod.yml build/apex-ai-insights/

echo -e "${GREEN}   ✓ PHP core copied${NC}"

# =============================================================================
# Step 5: Create Distribution ZIP
# =============================================================================
echo -e "${YELLOW}📦 Step 5/5: Creating release package...${NC}"

cd build

# Create the ZIP, excluding development files
zip -rq ../apex-ai-insights.zip apex-ai-insights \
    -x "*.git*" \
    -x "*/.DS_Store" \
    -x "*/node_modules/*" \
    -x "*/.env*" \
    -x "*/composer.lock" \
    -x "*/*.log"

cd ..

# Calculate final package size
ZIP_SIZE=$(du -h apex-ai-insights.zip | cut -f1)

# =============================================================================
# Build Summary
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ BUILD COMPLETE!                         ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Version:     ${VERSION}                                    ║${NC}"
echo -e "${GREEN}║  Build Date:  ${BUILD_DATE}                                      ║${NC}"
echo -e "${GREEN}║  Package:     apex-ai-insights.zip (${ZIP_SIZE})                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Package contents:"
unzip -l apex-ai-insights.zip | tail -1
echo ""
echo -e "${CYAN}To deploy: Upload apex-ai-insights.zip to WordPress or extract manually.${NC}"
