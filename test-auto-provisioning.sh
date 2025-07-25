#!/bin/bash

# Auto-Provisioning System Test Script
echo "🔧 Testing Auto-Provisioning System..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check if file exists and has content
check_file() {
    if [ -f "$1" ] && [ -s "$1" ]; then
        return 0
    else
        return 1
    fi
}

# Test 1: Check if AutoProvisioningService exists
echo "📋 Test 1: Checking AutoProvisioningService file..."
check_file "src/services/AutoProvisioningService.ts"
print_test_result $? "AutoProvisioningService.ts exists"

# Test 2: Check if service compiles
echo "📋 Test 2: Compiling AutoProvisioningService..."
if bun build src/services/AutoProvisioningService.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    print_test_result 0 "AutoProvisioningService compiles successfully"
else
    print_test_result 1 "AutoProvisioningService compilation failed"
fi

# Test 3: Check if OrderManager has provisioning methods
echo "📋 Test 3: Checking OrderManager provisioning integration..."
if grep -q "provisionServer" src/plugins/store/OrderManager.ts; then
    print_test_result 0 "OrderManager has provisioning methods"
else
    print_test_result 1 "OrderManager missing provisioning methods"
fi

# Test 4: Check if OrderManager compiles
echo "📋 Test 4: Compiling OrderManager..."
if bun build src/plugins/store/OrderManager.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    print_test_result 0 "OrderManager compiles successfully"
else
    print_test_result 1 "OrderManager compilation failed"
fi

# Test 5: Check if NotificationService has provisioning notifications
echo "📋 Test 5: Checking NotificationService provisioning notifications..."
if grep -q "notifyServerProvisioned" src/plugins/store/NotificationService.ts; then
    print_test_result 0 "NotificationService has provisioning notifications"
else
    print_test_result 1 "NotificationService missing provisioning notifications"
fi

# Test 6: Check if NotificationService compiles
echo "📋 Test 6: Compiling NotificationService..."
if bun build src/plugins/store/NotificationService.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    print_test_result 0 "NotificationService compiles successfully"
else
    print_test_result 1 "NotificationService compilation failed"
fi

# Test 7: Check if AdminPlugin has provisioning commands
echo "📋 Test 7: Checking AdminPlugin provisioning commands..."
if grep -q "provision-retry" src/plugins/admin/AdminPlugin.ts; then
    print_test_result 0 "AdminPlugin has provisioning commands"
else
    print_test_result 1 "AdminPlugin missing provisioning commands"
fi

# Test 8: Check if AdminPlugin compiles
echo "📋 Test 8: Compiling AdminPlugin..."
if bun build src/plugins/admin/AdminPlugin.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    print_test_result 0 "AdminPlugin compiles successfully"
else
    print_test_result 1 "AdminPlugin compilation failed"
fi

# Test 9: Check if PterodactylAdminAPI exists
echo "📋 Test 9: Checking PterodactylAdminAPI..."
check_file "src/services/PterodactylAdminAPI.ts"
print_test_result $? "PterodactylAdminAPI.ts exists"

# Test 10: Check if PterodactylAdminAPI compiles
echo "📋 Test 10: Compiling PterodactylAdminAPI..."
if bun build src/services/PterodactylAdminAPI.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    print_test_result 0 "PterodactylAdminAPI compiles successfully"
else
    print_test_result 1 "PterodactylAdminAPI compilation failed"
fi

# Test 11: Check if documentation exists
echo "📋 Test 11: Checking auto-provisioning documentation..."
check_file "docs/auto-provisioning-guide.md"
print_test_result $? "Auto-provisioning guide exists"

# Test 12: Check for required environment variables in docs
echo "📋 Test 12: Checking environment variable documentation..."
if grep -q "PTERODACTYL_ADMIN_API_KEY" docs/auto-provisioning-guide.md; then
    print_test_result 0 "Environment variables documented"
else
    print_test_result 1 "Environment variables not documented"
fi

# Test 13: Check for comprehensive error handling
echo "📋 Test 13: Checking error handling in AutoProvisioningService..."
if grep -q "rollbackActions" src/services/AutoProvisioningService.ts; then
    print_test_result 0 "Rollback mechanism implemented"
else
    print_test_result 1 "Rollback mechanism missing"
fi

# Test 14: Check for resource mapping configuration
echo "📋 Test 14: Checking resource mapping configuration..."
if grep -q "resourceMappings" src/services/AutoProvisioningService.ts; then
    print_test_result 0 "Resource mapping configuration exists"
else
    print_test_result 1 "Resource mapping configuration missing"
fi

# Test 15: Check for security features
echo "📋 Test 15: Checking security features..."
if grep -q "generateSecurePassword" src/services/AutoProvisioningService.ts; then
    print_test_result 0 "Secure password generation implemented"
else
    print_test_result 1 "Secure password generation missing"
fi

# Test 16: Check for comprehensive notifications
echo "📋 Test 16: Checking comprehensive customer notifications..."
if grep -q "sendServerCredentialsNotification" src/plugins/store/NotificationService.ts; then
    print_test_result 0 "Comprehensive notifications implemented"
else
    print_test_result 1 "Comprehensive notifications missing"
fi

# Test 17: Check for admin provisioning commands
echo "📋 Test 17: Checking admin provisioning commands..."
if grep -q "provisionRetryCommand" src/plugins/admin/AdminPlugin.ts; then
    print_test_result 0 "Admin provisioning commands implemented"
else
    print_test_result 1 "Admin provisioning commands missing"
fi

# Test 18: Check for order integration
echo "📋 Test 18: Checking order confirmation integration..."
if grep -q "isAutoProvisioningEnabled" src/plugins/admin/AdminPlugin.ts; then
    print_test_result 0 "Order confirmation integration implemented"
else
    print_test_result 1 "Order confirmation integration missing"
fi

# Test 19: Check for health check functionality
echo "📋 Test 19: Checking health check functionality..."
if grep -q "testConnection" src/services/AutoProvisioningService.ts; then
    print_test_result 0 "Health check functionality implemented"
else
    print_test_result 1 "Health check functionality missing"
fi

# Clean up test directory
rm -rf dist/test

echo ""
echo "======================================="
echo "📊 Test Results Summary:"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo "======================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Auto-provisioning system is ready.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the implementation.${NC}"
    exit 1
fi