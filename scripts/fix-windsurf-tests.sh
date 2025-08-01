#!/bin/bash

echo "🔧 Windsurf Test Fix Script"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clear Jest cache
echo -e "${YELLOW}Step 1: Clearing Jest cache...${NC}"
npx jest --clearCache

# Step 2: Install missing dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install --save-dev \
  @types/jest \
  ts-jest \
  jest \
  @types/node \
  typescript

# Step 3: Install runtime dependencies for Windsurf services
echo -e "${YELLOW}Step 3: Installing Windsurf service dependencies...${NC}"
npm install --save \
  @tensorflow/tfjs \
  @tensorflow/tfjs-node \
  mathjs \
  jstat \
  simple-statistics \
  technicalindicators \
  prom-client \
  optimization-js \
  semver \
  uuid \
  events

# Step 4: Create necessary directories
echo -e "${YELLOW}Step 4: Creating directories...${NC}"
mkdir -p src/services/windsurf
mkdir -p tests/services
mkdir -p tests/setup

# Step 5: Update package.json scripts
echo -e "${YELLOW}Step 5: Updating package.json scripts...${NC}"
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"
npm pkg set scripts.test:clear="jest --clearCache"
npm pkg set scripts.test:debug="node --inspect-brk ./node_modules/.bin/jest --runInBand"
npm pkg set scripts.test:windsurf="jest tests/setup/verifySetup.test.ts"

# Step 6: Run the verification test
echo -e "${YELLOW}Step 6: Running verification test...${NC}"
npm run test:windsurf

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Setup verified! All imports are working correctly.${NC}"
    echo -e "${GREEN}You can now run your tests with: npm test${NC}"
else
    echo -e "${RED}❌ Tests failed. Checking for common issues...${NC}"
    
    # Additional debugging
    echo -e "${YELLOW}Checking file existence...${NC}"
    ls -la src/services/windsurf/
    
    echo -e "${YELLOW}Checking TypeScript version...${NC}"
    npx tsc --version
    
    echo -e "${YELLOW}Checking Jest version...${NC}"
    npx jest --version
fi

echo -e "${YELLOW}Additional commands you can use:${NC}"
echo "  npm test                    # Run all tests"
echo "  npm run test:watch          # Run tests in watch mode"
echo "  npm run test:coverage       # Run tests with coverage"
echo "  npm run test:clear          # Clear Jest cache"
echo "  npm run test:debug          # Debug tests"

echo -e "${GREEN}Script completed!${NC}"