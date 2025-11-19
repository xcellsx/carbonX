This web-based backend application is built on Java, using the Spring Framework. The purpose of this documentation is to help the reader familiarise with the development environment and architecture for this application. As a reminder, this documentation does NOT reflect the requirements for customers to use this application, but rather serves to improve the relatively sparse documentation for the open-source code and encourage the community to further build on top of this wonderful tool created by the openLCA team.

# Requirements
* JDK 25 (LTS)
* Maven 3.9.11
* Spring Boot 3.5.7

# Application Dependencies
The full list of the dependencies and their properties can be viewed under the `pom.xml` file, but in summary:

**Spring Starter Tools:**
- Spring Starter Web
- Spring Starter Dev Tools
- Spring Starter Actuator

**ArangoDB**
- arangodb-spring-boot-starter (ver. 3.4-0)

---

# To-Do
This list seeks to align the development process for the backend application. The current focus is to map out the required backend API endpoints that is used by the frontend controllers:
- [ ] `AnalyticsController.java`
- [x] `AuthController.java` ✅
- [ ] `CompanyInfoController.java`
- [ ] `DashboardController.java`
- [ ] `HealthController.java`
- [ ] `LcaCalculationController.java`
- [ ] `NetworkController.java`
- [ ] `OpenLCAController.java`
- [ ] `ProductController.java`
- [ ] `ProductInventoryController.java`
- [x] `UserController.java` ✅

## Luvyn
- [x] ~~Map out Celine's `UserController.java` endpoints to our backend implementation~~ ✅ **COMPLETED**
  - Created complete RESTful User API with 9 endpoints
  - ArangoDB integration with User entity and repository
  - CORS configuration for frontend connectivity
  - DTO pattern for secure responses
  - Full documentation and testing interface
  - See: `backend/docs/API_Documentation.md` and `QUICK_START_USER_API.md`

- [x] ~~Map out Celine's `AuthController.java` endpoints to our backend implementation~~ ✅ **COMPLETED**
  - Created comprehensive Authentication API with 10 endpoints
  - Register, login, logout, password management, token validation
  - Separation of auth concerns from user management
  - Production-ready architecture with JWT/email placeholders
  - Security best practices documented
  - See: `backend/docs/AUTH_CONTROLLER_MAPPING.md`

## Hilman
- Create backend dashboard using Spring-Actuator library
- Map out Celine's `ProductController.java` endpoints to our backend implementation
