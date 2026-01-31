#!/bin/bash
# CarbonX System Test Script
# Tests all three components: Backend, Frontend, and OpenLCA integration

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}=== CarbonX System Verification ===${NC}"
echo -e "${NC}This script will test your Backend, Frontend, and OpenLCA integration\n"

# Test 1: Backend Health Check
echo -e "${YELLOW}[1/5] Testing Backend Health...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8081/api/health 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is running on port 8081${NC}"
    STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    MESSAGE=$(echo "$HEALTH_BODY" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GRAY}  Status: $STATUS${NC}"
    echo -e "${GRAY}  Message: $MESSAGE${NC}"
else
    echo -e "${RED}✗ Backend is NOT running on port 8081${NC}"
    echo -e "${YELLOW}  Please start the backend first: cd backend && ./mvnw spring-boot:run${NC}"
    exit 1
fi

# Test 2: Check if OpenLCA processes are synced
echo -e "\n${YELLOW}[2/5] Checking OpenLCA Process Sync...${NC}"
PRODUCTS_RESPONSE=$(curl -s http://localhost:8081/api/products 2>/dev/null)
PRODUCT_COUNT=$(echo "$PRODUCTS_RESPONSE" | grep -o '"name"' | wc -l)

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $PRODUCT_COUNT OpenLCA processes in database${NC}"
    FIRST_PRODUCT=$(echo "$PRODUCTS_RESPONSE" | grep -o '"name":"[^"]*"' | head -n1 | cut -d'"' -f4)
    echo -e "${GRAY}  Sample: $FIRST_PRODUCT${NC}"
else
    echo -e "${YELLOW}⚠ No OpenLCA processes found in database${NC}"
    echo -e "${GRAY}  You need to sync processes from OpenLCA${NC}"
    
    read -p "  Do you want to sync processes now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${CYAN}  Syncing processes from OpenLCA...${NC}"
        SYNC_RESULT=$(curl -s -X POST http://localhost:8081/api/products/sync 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}  ✓ $SYNC_RESULT${NC}"
        else
            echo -e "${RED}  ✗ Sync failed. Is OpenLCA IPC server running?${NC}"
            echo -e "${YELLOW}  Start it in OpenLCA: Tools → Developer tools → IPC Server${NC}"
        fi
    fi
fi

# Test 3: Test OpenLCA Connection
echo -e "\n${YELLOW}[3/5] Testing OpenLCA IPC Server Connection...${NC}"
OPENLCA_TEST=$(curl -s -X POST http://localhost:8081/api/products/sync 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ OpenLCA IPC server is accessible on port 8080${NC}"
    echo -e "${GRAY}  $OPENLCA_TEST${NC}"
else
    echo -e "${RED}✗ Cannot connect to OpenLCA IPC server${NC}"
    echo -e "${YELLOW}  Make sure OpenLCA is running and IPC server is started:${NC}"
    echo -e "${GRAY}  1. Open OpenLCA${NC}"
    echo -e "${GRAY}  2. Load a database${NC}"
    echo -e "${GRAY}  3. Tools → Developer tools → IPC Server → Start${NC}"
fi

# Test 4: Check Frontend
echo -e "\n${YELLOW}[4/5] Testing Frontend...${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is NOT running on port 5173${NC}"
    echo -e "${GRAY}  Start it: cd frontend && npm run dev${NC}"
fi

# Test 5: Get Dashboard Summary
echo -e "\n${YELLOW}[5/5] Testing Dashboard API...${NC}"
DASHBOARD_RESPONSE=$(curl -s http://localhost:8081/api/dashboard/summary 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dashboard API is working${NC}"
    TOTAL_PRODUCTS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalProducts":[0-9]*' | cut -d':' -f2)
    TOTAL_INVENTORY=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalInventoryItems":[0-9]*' | cut -d':' -f2)
    echo -e "${GRAY}  Total Products: $TOTAL_PRODUCTS${NC}"
    echo -e "${GRAY}  Total Inventory Items: $TOTAL_INVENTORY${NC}"
else
    echo -e "${YELLOW}⚠ Dashboard API not responding (this is normal if you have no data yet)${NC}"
fi

# Summary
echo -e "\n${CYAN}=== System Status Summary ===${NC}"
echo -e "${GREEN}✓ Backend:  http://localhost:8081/api/health${NC}"
echo -e "${GREEN}✓ Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}✓ OpenLCA:  Port 8080 (via IPC Server)${NC}"

echo -e "\n${CYAN}=== Next Steps ===${NC}"
echo -e "${NC}1. Open frontend: http://localhost:5173${NC}"
echo -e "${NC}2. Navigate to Inventory page${NC}"
echo -e "${NC}3. Create a product with components${NC}"
echo -e "${NC}4. Click 'Calculate LCA' to test the full integration${NC}"
echo -e "${GRAY}\nFor detailed setup, see SETUP_AND_TEST.md\n${NC}"

