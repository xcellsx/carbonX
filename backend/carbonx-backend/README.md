CarbonX Backend
================

Spring Boot service that exposes REST endpoints and relays JSON-RPC calls to an openLCA IPC bridge.

Run
---

Requirements:

- Java 17+, Maven 3.9+
- IPC bridge listening on `http://127.0.0.1:8081/rpc`

Start the service:

```bash
mvn spring-boot:run
```

Service starts on `http://localhost:8080`.

Endpoints
---------

- `GET /api/lca/ping` — health check against the IPC bridge
- `POST /api/lca/pcf` — forwards a payload to `calculatePcf` JSON-RPC method

Configuration
-------------

`src/main/resources/application.yml`:

```yaml
olca:
  ipcBaseUrl: http://127.0.0.1:8081
  mock: false
spring:
  datasource:
    url: jdbc:h2:file:./data/carbonx;MODE=PostgreSQL;DATABASE_TO_UPPER=false
    driver-class-name: org.h2.Driver
    username: sa
    password: ""
  flyway:
    enabled: true
```

Override via environment variables (Windows PowerShell):

```powershell
$env:OLCA_IPCBASEURL = "http://localhost:9090"
```

Database
--------
- Dev uses H2 file DB in `backend/carbonx-backend/data/carbonx.mv.db` with Flyway migrations.
- Prod: switch to Postgres by setting (example):

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/carbonx"
$env:SPRING_DATASOURCE_USERNAME = "carbonx"
$env:SPRING_DATASOURCE_PASSWORD = "changeme"
```

Verify DB connectivity:

```bash
curl http://127.0.0.1:8080/api/db/health
```


