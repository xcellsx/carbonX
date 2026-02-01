# CarbonX
The goal for CarbonX is to make LCA analysis for carbon emissions simple and user-friendly. The initial idea is to set up a network graph and utilise its basic query methods to quickly traverse the grapch and calculate the LCA metrics. As a result, this reduces the need for us to manually map out the relational behaviours and saves us a lot of time to test out the viability of the solution.

The initial plan is to use [ArangoDB's free community edition](https://docs.arangodb.com/stable/develop/) due to the following main reasons:
- Schema-less philosophy which allows the flexible integration of different database types
- Cost savings due to open-source nature
- Self-hosting capabilities for security reasons
- Support for integrations with other applications and microservices
- Is shipped with Docker, which makes it very usable for various operating systems

### > Requirements
* JDK 17+ (project uses 17)
* Maven 3.9+
* Spring Boot 3.5.7
* **ArangoDB** (required; see below)
---
### > ArangoDB setup (required before running the app)

The backend expects ArangoDB at **localhost:8529** with:
- **Database:** `testCompany`
- **User:** `root`
- **Password:** `test`

**Option A – Docker (recommended)**

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) if needed.
2. Start ArangoDB with the password your app uses:
   ```bash
   docker run -e ARANGO_ROOT_PASSWORD=test -p 8529:8529 -d --name carbonx-arango arangodb/arangodb:latest
   ```
3. Create the database (one-time). Open **http://localhost:8529** in a browser, log in with username `root` and password `test`, then in the **Databases** tab click **Create database** and name it `testCompany`.  
   Or from the host (with ArangoDB running):
   ```bash
   docker exec -it carbonx-arango arangosh --server.username root --server.password test --javascript.execute-string "db._createDatabase('testCompany');"
   ```
   (Use `--javascript.execute-string` for inline code; `--javascript.execute` is for file paths.)
4. Restart your backend; it will connect to ArangoDB and listen on port 8080.

**Option B – Native install**

1. Download the community server: https://www.arangodb.com/download/
2. Install and start the ArangoDB service (port 8529).
3. Set the root password to `test` (or change `arangodb.spring.data.password` in `src/main/resources/application.properties` to match).
4. In the ArangoDB web UI (http://localhost:8529) or with `arangosh`, create a database named `testCompany`.

---
### > How to Run the App
`mvnw spring-boot:run`

### > How to Debug the App
1. If you're using VS Code, set the "java.debug.settings.hotCodeReplace" setting to "auto" (default is "manual"). This tells VS Code to automatically recompile the code changes without needing to restart the application.
2. Under the 'CarbonXApplication.java' file, click on the 'Debug Java' button to start the application in 'Debug Mode'.
---
### > Java Project Components
1. Interfaces
2. Implementations