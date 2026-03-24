package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for ArangoDB User management operations.
 * Provides methods for creating, updating, and managing user accounts and permissions.
 */
@Slf4j
@Service
public class ArangoUserService extends BaseArangoService {

    // ==================== User CRUD ====================

    /**
     * List all users
     * GET /_api/user/
     */
    public Mono<Map> listUsers() {
        log.info("Listing all users");
        return get("/user/", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed users"));
    }

    /**
     * Create a user
     * POST /_api/user
     */
    public Mono<Map> createUser(String username, String password, Boolean active,
                                 Map<String, Object> extra) {
        log.info("Creating user: {}", username);
        
        Map<String, Object> body = new HashMap<>();
        body.put("user", username);
        body.put("passwd", password);
        
        if (active != null) body.put("active", active);
        if (extra != null) body.put("extra", extra);

        return post("/user", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created user: {}", username));
    }

    /**
     * Get a user
     * GET /_api/user/{user}
     */
    public Mono<Map> getUser(String username) {
        log.info("Getting user: {}", username);
        return get("/user/{user}", Map.class, username)
                .doOnSuccess(result -> log.info("Successfully retrieved user: {}", username));
    }

    /**
     * Update a user (partial)
     * PATCH /_api/user/{user}
     */
    public Mono<Map> updateUser(String username, String password, Boolean active,
                                 Map<String, Object> extra) {
        log.info("Updating user: {}", username);
        
        Map<String, Object> body = new HashMap<>();
        if (password != null) body.put("passwd", password);
        if (active != null) body.put("active", active);
        if (extra != null) body.put("extra", extra);

        return patch("/user/{user}", body, Map.class, username)
                .doOnSuccess(result -> log.info("Successfully updated user: {}", username));
    }

    /**
     * Replace a user (full)
     * PUT /_api/user/{user}
     */
    public Mono<Map> replaceUser(String username, String password, Boolean active,
                                  Map<String, Object> extra) {
        log.info("Replacing user: {}", username);
        
        Map<String, Object> body = new HashMap<>();
        body.put("passwd", password);
        if (active != null) body.put("active", active);
        if (extra != null) body.put("extra", extra);

        return put("/user/{user}", body, Map.class, username)
                .doOnSuccess(result -> log.info("Successfully replaced user: {}", username));
    }

    /**
     * Remove a user
     * DELETE /_api/user/{user}
     */
    public Mono<Map> deleteUser(String username) {
        log.info("Deleting user: {}", username);
        return delete("/user/{user}", Map.class, username)
                .doOnSuccess(result -> log.info("Successfully deleted user: {}", username));
    }

    // ==================== Database Access Levels ====================

    /**
     * List a user's accessible databases
     * GET /_api/user/{user}/database/
     */
    public Mono<Map> getUserDatabases(String username, Boolean full) {
        log.info("Getting databases for user: {}", username);
        String uri = full != null && full 
            ? "/user/" + username + "/database/?full=true"
            : "/user/" + username + "/database/";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved databases for user: {}", username));
    }

    /**
     * Get a user's database access level
     * GET /_api/user/{user}/database/{dbname}
     */
    public Mono<Map> getDatabaseAccessLevel(String username, String database) {
        log.info("Getting database access level for user: {}, database: {}", username, database);
        return get("/user/{user}/database/{db}", Map.class, username, database)
                .doOnSuccess(result -> log.info("Successfully retrieved database access level"));
    }

    /**
     * Set a user's database access level
     * PUT /_api/user/{user}/database/{dbname}
     */
    public Mono<Map> setDatabaseAccessLevel(String username, String database, String grant) {
        log.info("Setting database access level for user: {}, database: {}, grant: {}", username, database, grant);
        
        Map<String, Object> body = new HashMap<>();
        body.put("grant", grant); // "rw", "ro", or "none"

        return put("/user/{user}/database/{db}", body, Map.class, username, database)
                .doOnSuccess(result -> log.info("Successfully set database access level"));
    }

    /**
     * Clear a user's database access level
     * DELETE /_api/user/{user}/database/{dbname}
     */
    public Mono<Map> clearDatabaseAccessLevel(String username, String database) {
        log.info("Clearing database access level for user: {}, database: {}", username, database);
        return delete("/user/{user}/database/{db}", Map.class, username, database)
                .doOnSuccess(result -> log.info("Successfully cleared database access level"));
    }

    // ==================== Collection Access Levels ====================

    /**
     * Get a user's collection access level
     * GET /_api/user/{user}/database/{dbname}/{collection}
     */
    public Mono<Map> getCollectionAccessLevel(String username, String database, String collection) {
        log.info("Getting collection access level for user: {}, database: {}, collection: {}", 
                 username, database, collection);
        return get("/user/{user}/database/{db}/{coll}", Map.class, username, database, collection)
                .doOnSuccess(result -> log.info("Successfully retrieved collection access level"));
    }

    /**
     * Set a user's collection access level
     * PUT /_api/user/{user}/database/{dbname}/{collection}
     */
    public Mono<Map> setCollectionAccessLevel(String username, String database, 
                                               String collection, String grant) {
        log.info("Setting collection access level for user: {}, database: {}, collection: {}, grant: {}", 
                 username, database, collection, grant);
        
        Map<String, Object> body = new HashMap<>();
        body.put("grant", grant); // "rw", "ro", or "none"

        return put("/user/{user}/database/{db}/{coll}", body, Map.class, username, database, collection)
                .doOnSuccess(result -> log.info("Successfully set collection access level"));
    }

    /**
     * Clear a user's collection access level
     * DELETE /_api/user/{user}/database/{dbname}/{collection}
     */
    public Mono<Map> clearCollectionAccessLevel(String username, String database, String collection) {
        log.info("Clearing collection access level for user: {}, database: {}, collection: {}", 
                 username, database, collection);
        return delete("/user/{user}/database/{db}/{coll}", Map.class, username, database, collection)
                .doOnSuccess(result -> log.info("Successfully cleared collection access level"));
    }
}
