#!/bin/bash

echo "🧪 Windsurf Phase 3 Integration Test Suite"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test and report status
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "\n${YELLOW}Testing: ${test_name}${NC}"
    echo "----------------------------------------"
    
    if npm test -- "$test_file" --silent 2>&1 | grep -q "PASS"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        ((TESTS_FAILED++))
        # Show detailed error
        npm test -- "$test_file" 2>&1 | grep -A 5 -B 5 "FAIL\|Error"
    fi
}

# Phase 3 Core Services
echo -e "${BLUE}Phase 3 Core Services Tests${NC}"
echo "============================"

run_test "Portfolio Optimization Service" "tests/services/PortfolioOptimizationService.test.ts"
run_test "Risk Management Engine" "tests/services/RiskManagementEngine.test.ts"
run_test "Feature Engineering Pipeline" "tests/services/FeatureEngineeringPipeline.test.ts"
run_test "Model Versioning Service" "tests/services/ModelVersioningService.test.ts"
run_test "Model Monitoring Service" "tests/services/ModelMonitoringService.test.ts"

# Integration Tests
echo -e "\n${BLUE}Integration Tests${NC}"
echo "=================="

# Check if all services can be imported together
echo -e "${YELLOW}Testing service imports...${NC}"
node -e "
try {
  const services = require('./src/services/windsurf/index.ts');
  console.log('✅ All services can be imported successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Service import failed:', error.message);
  process.exit(1);
}
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service imports - PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Service imports - FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Check dependencies
echo -e "\n${BLUE}Dependency Check${NC}"
echo "================="

REQUIRED_DEPS=(
    "mathjs"
    "simple-statistics"
    "uuid"
    "semver"
    "events"
    "prom-client"
    "@tensorflow/tfjs"
    "technicalindicators"
    "jstat"
    "optimization-js"
)

MISSING_DEPS=0
for dep in "${REQUIRED_DEPS[@]}"; do
    if npm list "$dep" --depth=0 2>/dev/null | grep -q "$dep"; then
        echo -e "${GREEN}✅ $dep - installed${NC}"
    else
        echo -e "${RED}❌ $dep - missing${NC}"
        ((MISSING_DEPS++))
    fi
done

if [ $MISSING_DEPS -eq 0 ]; then
    echo -e "${GREEN}✅ All dependencies installed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ $MISSING_DEPS dependencies missing${NC}"
    ((TESTS_FAILED++))
fi

# Summary
echo -e "\n${BLUE}Test Summary${NC}"
echo "============"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All Phase 3 integration tests passed!${NC}"
    echo -e "${GREEN}Windsurf is ready to proceed with Phase 4.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please fix the issues before proceeding.${NC}"
    exit 1
fi