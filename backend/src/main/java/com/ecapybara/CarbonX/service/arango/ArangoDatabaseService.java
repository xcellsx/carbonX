package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Database management operations.
 * Provides methods for creating, listing, and deleting databases.
 */
@Slf4j
@Service
public class ArangoDatabaseService extends BaseArangoService {

    // Note: Database operations require _system database access
    // These endpoints don't use the default database from WebClient

    /**
     * List all databases
     * GET /_db/_system/_api/database
     */
    public Mono<Map> listDatabases() {
        log.info("Listing all databases");
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_db/_system/_api/database")
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully listed databases"));
    }

    /**
     * Create a database
     * POST /_db/_system/_api/database
     */
    public Mono<Map> createDatabase(String name, List<Map<String, Object>> users,
                                     Integer replicationFactor, Integer writeConcern,
                                     String sharding) {
        log.info("Creating database: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        
        if (users != null) body.put("users", users);
        
        Map<String, Object> options = new HashMap<>();
        if (replicationFactor != null) options.put("replicationFactor", replicationFactor);
        if (writeConcern != null) options.put("writeConcern", writeConcern);
        if (sharding != null) options.put("sharding", sharding);
        if (!options.isEmpty()) body.put("options", options);

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_db/_system/_api/database")
                        .build())
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully created database: {}", name));
    }

    /**
     * Drop a database
     * DELETE /_db/_system/_api/database/{database-name}
     */
    public Mono<Map> dropDatabase(String databaseName) {
        log.info("Dropping database: {}", databaseName);
        return webClient.delete()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_db/_system/_api/database/" + databaseName)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully dropped database: {}", databaseName));
    }

    /**
     * Get information about the current database
     * GET /_api/database/current
     */
    public Mono<Map> getCurrentDatabase() {
        log.info("Getting current database info");
        return get("/database/current", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved current database info"));
    }

    /**
     * List accessible databases for current user
     * GET /_api/database/user
     */
    public Mono<Map> getUserDatabases() {
        log.info("Getting user accessible databases");
        return get("/database/user", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed user databases"));
    }
}
