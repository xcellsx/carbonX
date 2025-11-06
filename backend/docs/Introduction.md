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

**openLCA Modules:**
- openLCA Core
- openLCA IO