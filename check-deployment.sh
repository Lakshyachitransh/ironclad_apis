#!/bin/bash

# Quick deployment validation script
# Checks if Docker, docker-compose, and git are installed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking deployment prerequisites..."
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not installed"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    DC_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose: $DC_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose not installed"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓${NC} Git: $GIT_VERSION"
else
    echo -e "${RED}✗${NC} Git not installed"
    exit 1
fi

# Check Node (optional)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Node.js not found (optional)"
fi

# Check .env file
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file found"
else
    echo -e "${YELLOW}⚠${NC} .env file not found (will be created)"
fi

# Check docker daemon
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
else
    echo -e "${RED}✗${NC} Docker daemon is not running"
    exit 1
fi

# Check available disk space
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Disk space available: ${DISK_USAGE}% used"
else
    echo -e "${RED}✗${NC} Warning: Disk usage is ${DISK_USAGE}% - may cause issues"
fi

# Check available memory
if [ "$(uname)" == "Linux" ]; then
    MEM_AVAILABLE=$(free -h | awk 'NR==2 {print $7}')
    echo -e "${GREEN}✓${NC} Available memory: $MEM_AVAILABLE"
fi

echo ""
echo -e "${GREEN}✅ All prerequisites are installed!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Update .env with your configuration"
echo "  2. Run: docker-compose up -d"
echo "  3. Check: docker-compose logs -f api"
echo ""
