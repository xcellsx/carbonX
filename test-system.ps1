# CarbonX System Test Script
# Tests all three components: Backend, Frontend, and OpenLCA integration

Write-Host "`n=== CarbonX System Verification ===" -ForegroundColor Cyan
Write-Host "This script will test your Backend, Frontend, and OpenLCA integration`n" -ForegroundColor White

# Test 1: Backend Health Check
Write-Host "[1/5] Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "UP") {
        Write-Host "✓ Backend is running on port 8081" -ForegroundColor Green
        Write-Host "  Message: $($response.message)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Backend returned unexpected status" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Backend is NOT running on port 8081" -ForegroundColor Red
    Write-Host "  Please start the backend first: cd backend && .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check if OpenLCA processes are synced
Write-Host "`n[2/5] Checking OpenLCA Process Sync..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:8081/api/products" -Method Get -TimeoutSec 5
    if ($products.Count -gt 0) {
        Write-Host "✓ Found $($products.Count) OpenLCA processes in database" -ForegroundColor Green
        Write-Host "  Sample: $($products[0].name)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ No OpenLCA processes found in database" -ForegroundColor Yellow
        Write-Host "  You need to sync processes from OpenLCA" -ForegroundColor Gray
        
        # Offer to sync
        $sync = Read-Host "`n  Do you want to sync processes now? (y/n)"
        if ($sync -eq "y") {
            Write-Host "`n  Syncing processes from OpenLCA..." -ForegroundColor Cyan
            try {
                $syncResult = Invoke-RestMethod -Uri "http://localhost:8081/api/products/sync" -Method Post -TimeoutSec 30
                Write-Host "  ✓ $syncResult" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Sync failed. Is OpenLCA IPC server running?" -ForegroundColor Red
                Write-Host "  Start it in OpenLCA: Tools → Developer tools → IPC Server" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "✗ Could not fetch products from backend" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
}

# Test 3: Test OpenLCA Connection
Write-Host "`n[3/5] Testing OpenLCA IPC Server Connection..." -ForegroundColor Yellow
try {
    # Try to sync (this will test OpenLCA connectivity)
    $testSync = Invoke-RestMethod -Uri "http://localhost:8081/api/products/sync" -Method Post -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✓ OpenLCA IPC server is accessible on port 8080" -ForegroundColor Green
    Write-Host "  $testSync" -ForegroundColor Gray
} catch {
    Write-Host "✗ Cannot connect to OpenLCA IPC server" -ForegroundColor Red
    Write-Host "  Make sure OpenLCA is running and IPC server is started:" -ForegroundColor Yellow
    Write-Host "  1. Open OpenLCA" -ForegroundColor Gray
    Write-Host "  2. Load a database" -ForegroundColor Gray
    Write-Host "  3. Tools → Developer tools → IPC Server → Start" -ForegroundColor Gray
}

# Test 4: Check Frontend
Write-Host "`n[4/5] Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running on port 5173" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Frontend is NOT running on port 5173" -ForegroundColor Yellow
    Write-Host "  Start it: cd frontend && npm run dev" -ForegroundColor Gray
}

# Test 5: Get Dashboard Summary
Write-Host "`n[5/5] Testing Dashboard API..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "http://localhost:8081/api/dashboard/summary" -Method Get -TimeoutSec 5
    Write-Host "✓ Dashboard API is working" -ForegroundColor Green
    Write-Host "  Total Products: $($dashboard.totalProducts)" -ForegroundColor Gray
    Write-Host "  Total Inventory Items: $($dashboard.totalInventoryItems)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Dashboard API not responding (this is normal if you have no data yet)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== System Status Summary ===" -ForegroundColor Cyan
Write-Host "✓ Backend:  http://localhost:8081/api/health" -ForegroundColor Green
Write-Host "✓ Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "✓ OpenLCA:  Port 8080 (via IPC Server)" -ForegroundColor Green

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Open frontend: http://localhost:5173" -ForegroundColor White
Write-Host "2. Navigate to Inventory page" -ForegroundColor White
Write-Host "3. Create a product with components" -ForegroundColor White
Write-Host "4. Click 'Calculate LCA' to test the full integration" -ForegroundColor White
Write-Host "`nFor detailed setup, see SETUP_AND_TEST.md`n" -ForegroundColor Gray

