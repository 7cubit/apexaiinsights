#!/bin/bash
# ============================================
# Apex AI Insights - Quick Setup Script
# ============================================
# This script sets up the entire development environment.
# Usage: ./setup.sh
#
# What it does:
# 1. Creates .env file from template (if not exists)
# 2. Starts all Docker containers
# 3. Installs PHP dependencies (Composer)
# 4. Builds the React dashboard
# 5. Copies built assets to WordPress plugin
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Setting up Apex AI Insights...${NC}"
echo ""

# ============================================
# Step 1: Environment File
# ============================================
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env with your API keys before using AI features${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# ============================================
# Step 2: Start Docker Containers
# ============================================
echo -e "${CYAN}🐳 Starting Docker containers...${NC}"
docker compose up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready (20s)...${NC}"
sleep 20
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# ============================================
# Step 3: Install Composer Dependencies
# ============================================
echo -e "${CYAN}📦 Installing PHP dependencies...${NC}"

# Check if composer is already installed in container
if ! docker exec apex-wp which composer > /dev/null 2>&1; then
    echo -e "${YELLOW}  Installing Composer in WordPress container...${NC}"
    docker exec apex-wp bash -c "apt-get update -qq && apt-get install -y -qq unzip > /dev/null 2>&1"
    docker exec apex-wp bash -c "curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null 2>&1"
fi

docker exec apex-wp bash -c "cd /var/www/html/wp-content/plugins/apex-ai-insights && composer install --no-dev --quiet"
echo -e "${GREEN}✓ PHP dependencies installed${NC}"
echo ""

# ============================================
# Step 4: Build Dashboard
# ============================================
echo -e "${CYAN}🔨 Building React dashboard...${NC}"

# Wait for npm install to complete if first run
docker exec apex-dashboard sh -c "npm run build" 2>/dev/null || {
    echo -e "${YELLOW}  First run - waiting for npm install...${NC}"
    sleep 10
    docker exec apex-dashboard sh -c "npm run build"
}

# Copy built assets to plugin directory
mkdir -p plugin-core/assets/dist
docker cp apex-dashboard:/app/../plugin-core/assets/dist/. ./plugin-core/assets/dist/
echo -e "${GREEN}✓ Dashboard built and copied${NC}"
echo ""

# ============================================
# Complete!
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${CYAN}WordPress Admin:${NC}  http://localhost:8001/wp-admin"
echo -e "  ${CYAN}Dashboard Dev:${NC}    http://localhost:5173"
echo -e "  ${CYAN}Go Engine:${NC}        http://localhost:8080/health (internal)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Complete WordPress installation at http://localhost:8001"
echo -e "  2. Activate 'Apex AI Insights' plugin"
echo -e "  3. Configure your API keys in the plugin settings"
echo ""
