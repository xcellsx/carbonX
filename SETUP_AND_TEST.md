# CarbonX Setup and Testing Guide

## Overview
CarbonX is a full-stack Life Cycle Assessment (LCA) calculator that integrates React frontend, Spring Boot backend, and OpenLCA for environmental impact calculations.

## Prerequisites

### Required Software
1. **Java 17+** - For Spring Boot backend
2. **Maven** - For building the backend
3. **Node.js 18+** - For React frontend
4. **OpenLCA** - Desktop application for LCA calculations
   - Download from: https://www.openlca.org/download/

### System Architecture
```
Frontend (React/Vite)  →  Backend (Spring Boot)  →  OpenLCA IPC Server
    Port 5173              Port 8081                  Port 8080
```

---

## Step 1: Start OpenLCA IPC Server

### Installation
1. Download and install OpenLCA from https://www.openlca.org/download/
2. Open OpenLCA and load a database (you need a database with processes)
3. Enable the IPC Server:
   - Go to: **Tools → Developer tools → IPC Server**
   - Click **Start** (default port: 8080)
   - Keep OpenLCA running in the background

### Verification
The IPC server should show as "Running" in OpenLCA. The backend will connect to this server to perform LCA calculations.

---

## Step 2: Start the Backend

### Navigate to Backend Directory
```bash
cd backend
```

### Run the Spring Boot Application

**Option A: Using Maven Wrapper (Recommended)**
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

**Option B: Using Maven Directly**
```bash
mvn spring-boot:run
```

### Verify Backend is Running

The backend should start on **port 8081**. You should see:
```
Started DemoApplication in X.XXX seconds
```

**Test the health endpoint:**
```bash
# Using curl
curl http://localhost:8081/api/health

# Or open in browser:
# http://localhost:8081/api/health
```

Expected response:
```json
{
  "status": "UP",
  "message": "Backend is running successfully!"
}
```

### Check H2 Database Console (Optional)
The backend uses an H2 database. You can access the console at:
```
http://localhost:8081/h2-console
```

Connection details:
- JDBC URL: `jdbc:h2:file:./data/carbonxdb`
- Username: `sa`
- Password: (leave empty)

---

## Step 3: Start the Frontend

### Navigate to Frontend Directory
```bash
cd frontend
```

### Install Dependencies (First Time Only)
```bash
npm install
```

### Run the Development Server
```bash
npm run dev
```

The frontend should start on **port 5173** (default Vite port).

### Open the Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## Step 4: Test the Complete System

### 1. Health Check
- Open the frontend: http://localhost:5173
- The app should load without errors
- Check the browser console for any connection errors

### 2. Sync OpenLCA Processes
Before you can use LCA calculations, you need to sync processes from OpenLCA to your backend database.

**Create a sync endpoint test:**

```bash
# Test if backend can connect to OpenLCA
curl -X POST http://localhost:8081/api/products/sync-openlca
```

This will fetch all available processes from OpenLCA and store them in the backend database.

### 3. Test LCA Calculation

Navigate to the **Inventory** page in the frontend and:

1. **Create a Product** with Bill of Materials (BoM)
2. **Add Components** with:
   - Component name
   - Process (search from OpenLCA database)
   - Weight in kg
3. **Click "Calculate LCA"** for each component
4. The system will:
   - Send request to backend
   - Backend calls OpenLCA IPC server
   - Calculate environmental impact (Climate Change in kg CO₂-eq)
   - Display results

### 4. Test Network Visualization

Navigate to the **Network** page to:
- Visualize supply chain relationships
- See LCA contribution graphs
- Analyze upstream process impacts

---

## Troubleshooting

### Backend Won't Start
- **Issue:** Port 8081 already in use
- **Solution:** Stop any other services on port 8081 or change the port in `backend/src/main/resources/application.properties`

### Frontend Can't Connect to Backend
- **Issue:** CORS errors or connection refused
- **Solution:** 
  - Ensure backend is running on port 8081
  - Check `frontend/src/services/api.js` has correct URL: `http://localhost:8081/api`
  - The backend has CORS configured in `WebConfig.java`

### OpenLCA Connection Failed
- **Issue:** LCA calculations fail with connection error
- **Solution:**
  - Verify OpenLCA is running
  - Verify IPC Server is started (Tools → Developer tools → IPC Server)
  - Check port 8080 is not blocked
  - Verify database is loaded in OpenLCA

### No Processes Available
- **Issue:** Process dropdown is empty
- **Solution:**
  - Sync processes from OpenLCA using the sync endpoint
  - Ensure OpenLCA has a database with processes loaded

---

## API Endpoints Reference

### Backend Endpoints

#### Health Check
```
GET /api/health
```

#### Products
```
GET    /api/products           - Get all products
GET    /api/products/{id}      - Get product by ID
POST   /api/products           - Create new product
PUT    /api/products/{id}      - Update product
DELETE /api/products/{id}      - Delete product
```

#### Inventory
```
GET    /api/inventory          - Get all inventory items
POST   /api/inventory          - Create inventory item
PUT    /api/inventory/{id}     - Update inventory
DELETE /api/inventory/{id}     - Delete inventory
```

#### LCA Calculation
```
POST   /api/openlca/calculate  - Calculate LCA for components
```

Request body example:
```json
{
  "components": [
    {
      "processId": "process-uuid-or-name",
      "weight": 1.5
    }
  ],
  "inventoryId": 123
}
```

Response example:
```json
{
  "results": [
    {
      "processId": "process-name",
      "weight": 1.5,
      "lcaValue": 2.345,
      "unit": "kg CO₂-eq"
    }
  ]
}
```

---

## Development Notes

### Backend Configuration
- Database: H2 (file-based, stored in `backend/data/carbonxdb.mv.db`)
- JPA: Auto-update schema on startup
- Logging: DEBUG level for `com.carbonx.demo`

### Frontend Configuration
- Build tool: Vite (faster than CRA)
- State management: React hooks
- HTTP client: Axios
- Charts: Chart.js and D3.js for visualizations

### OpenLCA Integration
- Protocol: JSON-RPC 2.0
- Impact method: ReCiPe 2016 (Climate change)
- Calculation steps:
  1. `result/calculate` - Start calculation
  2. `result/state` - Poll until ready
  3. `result/total-impacts` - Get results
  4. `result/dispose` - Cleanup

---

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
./mvnw spring-boot:run

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Terminal 3: Test health check
curl http://localhost:8081/api/health
```

Then open http://localhost:5173 in your browser!

---

## Next Steps

1. **Load OpenLCA Database**: Ensure you have a database with processes (e.g., Ecoinvent)
2. **Sync Processes**: Import processes from OpenLCA to backend
3. **Create Products**: Add products with bill of materials
4. **Calculate LCA**: Run environmental impact assessments
5. **Analyze Results**: Use dashboard and analytics to visualize data

