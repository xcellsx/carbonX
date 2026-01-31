# Useful Links
[Download ArangoDB](https://arango.ai/downloads/)
[Get Started with Spring Boot Integration](https://docs.arango.ai/ecosystem/integrations/spring-boot-arangodb/)
[ArangoDB Data Platform - Documentation](https://docs.arango.ai/data-platform/)
[Available Testing Datasets for ArangoDB](https://docs.arango.ai/ecosystem/arango-datasets/)

# Configurations
You can access the web interface at [localhost:8529](localhost:8529) with the following user credentials:
*username: root*
*password: test*

# Database Entries
Every entry in the database MUST have 2 field populated:

## 1. [`_id`](https://docs.arango.ai/arangodb/3.11/concepts/data-structure/documents/)
The corresponding Java variable used in bean definitions within this application is `arangoId` and is usually accompanied by the *`@ArangoId`* annotator

## 2. [`_key`](https://docs.arango.ai/arangodb/3.11/concepts/data-structure/documents/)
The corresponding Java variable used in bean definitions within this application is `id` and is usually accompanied by the *`@Id`* annotator