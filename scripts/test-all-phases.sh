#!/bin/bash

echo "🧪 Windsurf Complete Test Suite - Phases 3 & 4"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test and report status
run_test() {
    local test_name=$1
    local test_file=$2
    
    ((TESTS_TOTAL++))
    echo -e "\n${YELLOW}[$TESTS_TOTAL] Testing: ${test_name}${NC}"
    echo "----------------------------------------"
    
    if [ -f "$test_file" ]; then
        if npm test -- "$test_file" --silent 2>&1 | grep -q "PASS"; then
            echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ ${test_name} - FAILED${NC}"
            ((TESTS_FAILED++))
            # Show detailed error
            npm test -- "$test_file" 2>&1 | tail -20
        fi
    else
        echo -e "${RED}❌ ${test_name} - TEST FILE NOT FOUND${NC}"
        echo -e "${RED}   Missing: $test_file${NC}"
        ((TESTS_FAILED++))
    fi
}

# Clear Jest cache first
echo -e "${YELLOW}Clearing Jest cache...${NC}"
npm run test:clear 2>/dev/null || npx jest --clearCache

# Phase 3 Tests
echo -e "\n${BLUE}=== PHASE 3: Financial Intelligence Tests ===${NC}"
run_test "Portfolio Optimization Service" "tests/services/PortfolioOptimizationService.test.ts"
run_test "Risk Management Engine" "tests/services/RiskManagementEngine.test.ts"
run_test "Portfolio Backtest Engine" "tests/services/PortfolioBacktestEngine.test.ts"
run_test "Multi-Factor Analysis Engine" "tests/services/MultiFactorAnalysisEngine.test.ts"
run_test "Advanced Risk Model Service" "tests/services/AdvancedRiskModelService.test.ts"

# Phase 4 Tests
echo -e "\n${BLUE}=== PHASE 4: Security & Compliance Tests ===${NC}"
run_test "JWT Auth Service" "tests/services/JWTAuthService.test.ts"
run_test "Compliance Service" "tests/services/ComplianceService.test.ts"
run_test "Audit Trail Service" "tests/services/AuditTrailService.test.ts"
run_test "Encryption Service" "tests/services/EncryptionService.test.ts"
run_test "GDPR Service" "tests/services/GDPRService.test.ts"

# Check if ComplianceService exports are available
echo -e "\n${BLUE}=== Checking ComplianceService Exports ===${NC}"
node -e "
try {
  const { ComplianceService } = require('./src/services/ComplianceService.ts');
  if (typeof ComplianceService.checkMiFIDII === 'function') {
    console.log('✅ checkMiFIDII method is available');
  } else {
    console.log('❌ checkMiFIDII method is missing');
  }
  if (typeof ComplianceService.checkGDPR === 'function') {
    console.log('✅ checkGDPR method is available');
  } else {
    console.log('❌ checkGDPR method is missing');
  }
} catch (error) {
  console.error('❌ Error checking ComplianceService:', error.message);
}
" 2>&1

# Summary
echo -e "\n${BLUE}=== TEST SUMMARY ===${NC}"
echo "===================="
echo -e "Total Tests Run: ${TESTS_TOTAL}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: $(( TESTS_TOTAL > 0 ? TESTS_PASSED * 100 / TESTS_TOTAL : 0 ))%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Ready for Phase 5.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  $TESTS_FAILED tests failed. Please fix the issues above.${NC}"
    
    # Provide helpful suggestions
    echo -e "\n${YELLOW}Troubleshooting Tips:${NC}"
    echo "1. For missing test files: Create them using the examples above"
    echo "2. For import errors: Use direct file imports instead of barrel imports"
    echo "3. For missing dependencies: npm install <package-name>"
    echo "4. For TypeScript errors: Check type definitions and interfaces"
    echo "5. Run individual tests with: npm test -- <test-file>"
    
    exit 1
fi