# CarbonX
The goal for CarbonX is to make LCA analysis for carbon emissions simple and user-friendly. The initial idea is to set up a network graph and utilise its basic query methods to quickly traverse the grapch and calculate the LCA metrics. As a result, this reduces the need for us to manually map out the relational behaviours and saves us a lot of time to test out the viability of the solution.

The initial plan is to use [ArangoDB's free community edition](https://docs.arangodb.com/stable/develop/) due to the following main reasons:
- Schema-less philosophy which allows the flexible integration of different database types
- Cost savings due to open-source nature
- Self-hosting capabilities for security reasons
- Support for integrations with other applications and microservices
- Is shipped with Docker, which makes it very usable for various operating systems

### > Requirements
* JDK 25 (LTS)
* Maven 3.9.11
* Spring Boot 3.5.7
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