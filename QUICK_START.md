# CarbonX Quick Start Guide

## ✅ Yes, You Have a Complete Full-Stack LCA System!

Your CarbonX project includes:
- ✓ **Backend** - Spring Boot Java REST API
- ✓ **Frontend** - React application with modern UI
- ✓ **LCA Integration** - Full OpenLCA connectivity for environmental calculations

---

## 🚀 How to Run Everything

### Prerequisites
1. **Java 17+** installed
2. **Node.js 18+** installed
3. **OpenLCA** desktop app installed

### Step-by-Step Setup

#### 1️⃣ Start OpenLCA IPC Server
```
1. Open OpenLCA desktop application
2. Load a database (must have processes)
3. Go to: Tools → Developer tools → IPC Server
4. Click "Start" (port 8080)
5. Keep OpenLCA running
```

#### 2️⃣ Start Backend (Terminal 1)
```bash
cd backend
./mvnw spring-boot:run      # Mac/Linux
.\mvnw.cmd spring-boot:run  # Windows
```
Wait for: `Started DemoApplication`

Backend will run on **http://localhost:8081**

#### 3️⃣ Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # First time only
npm run dev
```
Frontend will run on **http://localhost:5173**

#### 4️⃣ Open Application
```
http://localhost:5173
```

---

## 🧪 Verify Everything is Working

### Option 1: Use Test Script

**Windows (PowerShell):**
```powershell
.\test-system.ps1
```

**Mac/Linux:**
```bash
chmod +x test-system.sh
./test-system.sh
```

### Option 2: Manual Verification

**Test Backend:**
```bash
curl http://localhost:8081/api/health
```
Should return: `{"status":"UP","message":"Backend is running successfully!"}`

**Sync OpenLCA Processes:**
```bash
curl -X POST http://localhost:8081/api/products/sync
```
This imports all processes from OpenLCA to your backend database.

**Test Frontend:**
Open http://localhost:5173 in browser - you should see the CarbonX interface.

---

## 🧮 How to Test LCA Calculations

### Test the LCA Feature:

1. **Open Frontend**: http://localhost:5173

2. **Navigate to "Inventory" page**

3. **Create a Product**:
   - Click "Add New Product"
   - Enter product name
   - Click "Save"

4. **Add Components with Bill of Materials**:
   - Click on your product to expand it
   - Add components with:
     - Component name (e.g., "Steel frame")
     - Process (search for OpenLCA process, e.g., "steel production")
     - Weight in kg (e.g., 2.5)

5. **Calculate LCA**:
   - Click "Calculate LCA" button for each component
   - The system will:
     - ✓ Send request to backend
     - ✓ Backend queries OpenLCA via JSON-RPC
     - ✓ Calculate environmental impact (CO₂ equivalent)
     - ✓ Display result (e.g., "2.345 kgCO₂e")

6. **View Results**:
   - See individual component impacts
   - See total product LCA value
   - Navigate to "Analytics" for visualizations
   - Navigate to "Network" for supply chain graph

---

## 📊 What Each Component Does

### Backend (`localhost:8081`)
- REST API for products, inventory, users
- Database management (H2)
- OpenLCA integration via JSON-RPC
- LCA calculation orchestration
- Data persistence

**Key Endpoints:**
```
GET  /api/health              - Health check
GET  /api/products            - List all products
POST /api/products/sync       - Sync from OpenLCA
POST /api/openlca/calculate   - Calculate LCA
GET  /api/dashboard/summary   - Dashboard data
```

### Frontend (`localhost:5173`)
- React UI with routing
- Product & inventory management
- Interactive LCA calculations
- Dashboard with analytics
- Network visualization (D3.js)
- Real-time charts (Chart.js)

**Pages:**
- Dashboard - Overview and metrics
- Inventory - Product & BoM management + LCA
- Analytics - Data visualization
- Network - Supply chain graphs
- Guide - User instructions

### OpenLCA (`localhost:8080`)
- Desktop LCA software
- IPC Server for JSON-RPC API
- Environmental impact calculations
- Process database (Ecoinvent, etc.)
- Impact methods (ReCiPe 2016)

**Used For:**
- Climate change impact (kg CO₂-eq)
- Multi-step calculations
- Process contribution analysis
- Upstream supply chain modeling

---

## 🔧 Troubleshooting

### "Backend not running"
**Fix:** Start backend in `backend/` folder:
```bash
./mvnw spring-boot:run
```

### "OpenLCA connection failed"
**Fix:** 
1. Open OpenLCA desktop app
2. Load a database
3. Start IPC Server: Tools → Developer tools → IPC Server
4. Verify port 8080 is not blocked

### "No processes available"
**Fix:** Sync processes from OpenLCA:
```bash
curl -X POST http://localhost:8081/api/products/sync
```

### "Frontend CORS error"
**Fix:** Ensure backend is running on port 8081 (check `application.properties`)

### "Port already in use"
**Fix:** Change ports in configuration files:
- Backend: `backend/src/main/resources/application.properties` (line 13: `server.port=8081`)
- Frontend: `frontend/vite.config.js` (add port config)

---

## 📁 Project Structure

```
carbonX/
├── backend/                   # Spring Boot application
│   ├── src/main/java/...     # Java source code
│   ├── src/main/resources/
│   │   └── application.properties  # Config (ports, DB, OpenLCA)
│   ├── data/                 # H2 database files
│   └── pom.xml              # Maven dependencies
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React pages
│   │   ├── services/        # API client (api.js)
│   │   └── App.jsx         # Main app
│   └── package.json        # npm dependencies
├── SETUP_AND_TEST.md       # Detailed guide
├── QUICK_START.md          # This file
└── test-system.ps1/sh      # Verification scripts
```

---

## ✨ Key Features Working

✅ **Product Management** - Create, read, update, delete products  
✅ **Inventory System** - Bill of Materials tracking  
✅ **LCA Calculations** - Real-time environmental impact via OpenLCA  
✅ **Process Sync** - Import OpenLCA processes to backend  
✅ **Dashboard** - Summary metrics and statistics  
✅ **Analytics** - Charts and data visualization  
✅ **Network Graph** - Supply chain visualization with D3.js  
✅ **H2 Database** - Persistent data storage  
✅ **CORS Enabled** - Frontend-backend communication  

---

## 🎯 Next Steps

1. ✅ **Verify Setup**: Run `test-system.ps1` or `test-system.sh`
2. ✅ **Sync Processes**: Import OpenLCA database
3. ✅ **Create Products**: Add products with components
4. ✅ **Calculate LCA**: Test environmental impact calculations
5. ✅ **Explore Features**: Try Dashboard, Analytics, Network pages

---

## 📚 Additional Documentation

- **Full Setup Guide**: See `SETUP_AND_TEST.md`
- **OpenLCA Documentation**: https://www.openlca.org/
- **Backend API**: http://localhost:8081/api/
- **H2 Console**: http://localhost:8081/h2-console

---

## 🆘 Need Help?

**Common Issues:**
1. Ensure all three components are running (OpenLCA, Backend, Frontend)
2. Check firewall/antivirus isn't blocking ports 8080, 8081, 5173
3. Verify Java 17+ and Node 18+ are installed
4. Make sure OpenLCA has a database loaded

**Test Each Component:**
```bash
# Test backend
curl http://localhost:8081/api/health

# Test frontend
curl http://localhost:5173

# Test OpenLCA sync
curl -X POST http://localhost:8081/api/products/sync
```

---

**You're all set! Open http://localhost:5173 and start calculating LCAs! 🌱**

