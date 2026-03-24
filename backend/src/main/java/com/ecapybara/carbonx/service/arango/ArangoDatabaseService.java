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
                        .uri("/_db/_system/_api/database")
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
                        .uri("/_db/_system/_api/database")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully created database: {}", name));
    }

    /**
     * Drop a database
     * DELETE /_db/_system/_api/database/{database-name}
     */
    public Mono<Map> dropDatabase(String database) {
        log.info("Dropping database: {}", database);
        return webClient.delete()
                        .uri("/_db/_system/_api/database/" + database)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully dropped database: {}", database));
    }

    /**
     * Get information about the current database
     * GET /_db/{database-name}/_api/database/current
     */
    public Mono<Map> getCurrentDatabase(String database) {
        log.info("Getting current database info");
        return webClient.get()
                        .uri("/_db/" + database + "/_api/database/current")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved current database info"));
    }

    /**
     * List accessible databases for current user
     * GET /_api/database/user
     */
    public Mono<Map> getUserDatabases(String database) {
        log.info("Getting user accessible databases");
        return webClient.get()
                        .uri("/_db/" + database + "/_api/database/user")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully listed user databases"));
    }
}
