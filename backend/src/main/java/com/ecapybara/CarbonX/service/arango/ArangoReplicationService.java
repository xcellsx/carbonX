package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for ArangoDB Replication operations.
 * Provides methods for managing replication, WAL, and data synchronization.
 */
@Slf4j
@Service
public class ArangoReplicationService extends BaseArangoService {

    // ==================== Replication State ====================

    /**
     * Get replication server ID
     * GET /_api/replication/server-id
     */
    public Mono<Map> getServerId() {
        log.info("Getting replication server ID");
        return get("/replication/server-id", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved server ID"));
    }

    /**
     * Get replication logger state
     * GET /_api/replication/logger-state
     */
    public Mono<Map> getLoggerState() {
        log.info("Getting replication logger state");
        return get("/replication/logger-state", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved logger state"));
    }

    /**
     * Get first available replication tick
     * GET /_api/replication/logger-first-tick
     */
    public Mono<Map> getFirstTick() {
        log.info("Getting first available tick");
        return get("/replication/logger-first-tick", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved first tick"));
    }

    /**
     * Get tick ranges available in WAL
     * GET /_api/replication/logger-tick-ranges
     */
    public Mono<Map> getTickRanges() {
        log.info("Getting tick ranges in WAL");
        return get("/replication/logger-tick-ranges", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved tick ranges"));
    }

    // ==================== Inventory ====================

    /**
     * Get replication inventory
     * GET /_api/replication/inventory
     */
    public Mono<Map> getInventory(Boolean includeSystem, Boolean includeFoxxQueues,
                                   Long batchId) {
        log.info("Getting replication inventory");
        StringBuilder uri = new StringBuilder("/replication/inventory");
        String separator = "?";
        
        if (includeSystem != null) {
            uri.append(separator).append("includeSystem=").append(includeSystem);
            separator = "&";
        }
        if (includeFoxxQueues != null) {
            uri.append(separator).append("includeFoxxQueues=").append(includeFoxxQueues);
            separator = "&";
        }
        if (batchId != null) {
            uri.append(separator).append("batchId=").append(batchId);
        }

        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved inventory"));
    }

    /**
     * Get cluster collections and indexes
     * GET /_api/replication/clusterInventory
     */
    public Mono<Map> getClusterInventory(Boolean includeSystem) {
        log.info("Getting cluster inventory");
        String uri = includeSystem != null 
            ? "/replication/clusterInventory?includeSystem=" + includeSystem
            : "/replication/clusterInventory";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved cluster inventory"));
    }

    // ==================== Dump Batch ====================

    /**
     * Create a new dump batch
     * POST /_api/replication/batch
     */
    public Mono<Map> createBatch(Integer ttl, String state) {
        log.info("Creating dump batch");
        Map<String, Object> body = new HashMap<>();
        if (ttl != null) body.put("ttl", ttl);
        if (state != null) body.put("state", state);

        return post("/replication/batch", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created dump batch"));
    }

    /**
     * Extend the TTL of a dump batch
     * PUT /_api/replication/batch/{id}
     */
    public Mono<Map> extendBatch(String batchId, Integer ttl) {
        log.info("Extending batch TTL: {}", batchId);
        Map<String, Object> body = new HashMap<>();
        if (ttl != null) body.put("ttl", ttl);

        return put("/replication/batch/{id}", body, Map.class, batchId)
                .doOnSuccess(result -> log.info("Successfully extended batch: {}", batchId));
    }

    /**
     * Delete a dump batch
     * DELETE /_api/replication/batch/{id}
     */
    public Mono<Map> deleteBatch(String batchId) {
        log.info("Deleting batch: {}", batchId);
        return delete("/replication/batch/{id}", Map.class, batchId)
                .doOnSuccess(result -> log.info("Successfully deleted batch: {}", batchId));
    }

    // ==================== Dump ====================

    /**
     * Get replication dump
     * GET /_api/replication/dump
     */
    public Mono<String> getDump(String collection, Long batchId, Long chunkSize,
                                 Boolean includeSystem, Long ticks, Boolean flush) {
        log.info("Getting replication dump for collection: {}", collection);
        StringBuilder uri = new StringBuilder("/replication/dump");
        String separator = "?";
        
        if (collection != null) {
            uri.append(separator).append("collection=").append(collection);
            separator = "&";
        }
        if (batchId != null) {
            uri.append(separator).append("batchId=").append(batchId);
            separator = "&";
        }
        if (chunkSize != null) {
            uri.append(separator).append("chunkSize=").append(chunkSize);
            separator = "&";
        }
        if (includeSystem != null) {
            uri.append(separator).append("includeSystem=").append(includeSystem);
            separator = "&";
        }
        if (ticks != null) {
            uri.append(separator).append("ticks=").append(ticks);
            separator = "&";
        }
        if (flush != null) {
            uri.append(separator).append("flush=").append(flush);
        }

        return webClient.get()
                .uri(uri.toString())
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(result -> log.info("Successfully retrieved dump"));
    }

    // ==================== WAL Operations ====================

    /**
     * Get last available tick
     * GET /_api/wal/lastTick
     */
    public Mono<Map> getLastTick() {
        log.info("Getting last available tick");
        return get("/wal/lastTick", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved last tick"));
    }

    /**
     * Get WAL tick ranges
     * GET /_api/wal/range
     */
    public Mono<Map> getWalRange() {
        log.info("Getting WAL tick range");
        return get("/wal/range", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved WAL range"));
    }

    /**
     * Tail recent server operations
     * GET /_api/wal/tail
     */
    public Mono<String> tailWal(Long from, Long to, Long lastScanned, Long chunkSize,
                                 Boolean includeSystem, String serverId) {
        log.info("Tailing WAL operations");
        StringBuilder uri = new StringBuilder("/wal/tail");
        String separator = "?";
        
        if (from != null) {
            uri.append(separator).append("from=").append(from);
            separator = "&";
        }
        if (to != null) {
            uri.append(separator).append("to=").append(to);
            separator = "&";
        }
        if (lastScanned != null) {
            uri.append(separator).append("lastScanned=").append(lastScanned);
            separator = "&";
        }
        if (chunkSize != null) {
            uri.append(separator).append("chunkSize=").append(chunkSize);
            separator = "&";
        }
        if (includeSystem != null) {
            uri.append(separator).append("includeSystem=").append(includeSystem);
            separator = "&";
        }
        if (serverId != null) {
            uri.append(separator).append("serverId=").append(serverId);
        }

        return webClient.get()
                .uri(uri.toString())
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(result -> log.info("Successfully tailed WAL"));
    }

    // ==================== Applier ====================

    /**
     * Get replication applier configuration
     * GET /_api/replication/applier-config
     */
    public Mono<Map> getApplierConfig() {
        log.info("Getting applier configuration");
        return get("/replication/applier-config", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved applier config"));
    }

    /**
     * Update replication applier configuration
     * PUT /_api/replication/applier-config
     */
    public Mono<Map> setApplierConfig(String endpoint, String database, String username,
                                       String password, Integer maxConnectRetries,
                                       Integer connectTimeout, Integer requestTimeout,
                                       Integer chunkSize, Boolean autoStart,
                                       Boolean adaptivePolling, Boolean includeSystem,
                                       Boolean autoResync, Boolean autoResyncRetries,
                                       Integer initialSyncMaxWaitTime, Integer connectionRetryWaitTime,
                                       Integer idleMinWaitTime, Integer idleMaxWaitTime) {
        log.info("Setting applier configuration");
        Map<String, Object> body = new HashMap<>();
        
        if (endpoint != null) body.put("endpoint", endpoint);
        if (database != null) body.put("database", database);
        if (username != null) body.put("username", username);
        if (password != null) body.put("password", password);
        if (maxConnectRetries != null) body.put("maxConnectRetries", maxConnectRetries);
        if (connectTimeout != null) body.put("connectTimeout", connectTimeout);
        if (requestTimeout != null) body.put("requestTimeout", requestTimeout);
        if (chunkSize != null) body.put("chunkSize", chunkSize);
        if (autoStart != null) body.put("autoStart", autoStart);
        if (adaptivePolling != null) body.put("adaptivePolling", adaptivePolling);
        if (includeSystem != null) body.put("includeSystem", includeSystem);
        if (autoResync != null) body.put("autoResync", autoResync);
        if (autoResyncRetries != null) body.put("autoResyncRetries", autoResyncRetries);
        if (initialSyncMaxWaitTime != null) body.put("initialSyncMaxWaitTime", initialSyncMaxWaitTime);
        if (connectionRetryWaitTime != null) body.put("connectionRetryWaitTime", connectionRetryWaitTime);
        if (idleMinWaitTime != null) body.put("idleMinWaitTime", idleMinWaitTime);
        if (idleMaxWaitTime != null) body.put("idleMaxWaitTime", idleMaxWaitTime);

        return put("/replication/applier-config", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully set applier config"));
    }

    /**
     * Get replication applier state
     * GET /_api/replication/applier-state
     */
    public Mono<Map> getApplierState() {
        log.info("Getting applier state");
        return get("/replication/applier-state", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved applier state"));
    }

    /**
     * Start the replication applier
     * PUT /_api/replication/applier-start
     */
    public Mono<Map> startApplier(Long from) {
        log.info("Starting applier");
        String uri = from != null 
            ? "/replication/applier-start?from=" + from
            : "/replication/applier-start";
        return put(uri, new HashMap<>(), Map.class)
                .doOnSuccess(result -> log.info("Successfully started applier"));
    }

    /**
     * Stop the replication applier
     * PUT /_api/replication/applier-stop
     */
    public Mono<Map> stopApplier() {
        log.info("Stopping applier");
        return put("/replication/applier-stop", new HashMap<>(), Map.class)
                .doOnSuccess(result -> log.info("Successfully stopped applier"));
    }

    // ==================== Sync ====================

    /**
     * Start replication from a remote endpoint
     * PUT /_api/replication/sync
     */
    public Mono<Map> sync(String endpoint, String database, String username, String password,
                          Boolean includeSystem, Boolean incremental, String restrictType,
                          java.util.List<String> restrictCollections) {
        log.info("Starting sync from endpoint: {}", endpoint);
        Map<String, Object> body = new HashMap<>();
        
        body.put("endpoint", endpoint);
        if (database != null) body.put("database", database);
        if (username != null) body.put("username", username);
        if (password != null) body.put("password", password);
        if (includeSystem != null) body.put("includeSystem", includeSystem);
        if (incremental != null) body.put("incremental", incremental);
        if (restrictType != null) body.put("restrictType", restrictType);
        if (restrictCollections != null) body.put("restrictCollections", restrictCollections);

        return put("/replication/sync", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully started sync"));
    }

    /**
     * Turn a server into a follower
     * PUT /_api/replication/make-follower
     */
    public Mono<Map> makeFollower(String endpoint, String database, String username, String password,
                                   Boolean includeSystem, String restrictType,
                                   java.util.List<String> restrictCollections) {
        log.info("Making server a follower of: {}", endpoint);
        Map<String, Object> body = new HashMap<>();
        
        body.put("endpoint", endpoint);
        if (database != null) body.put("database", database);
        if (username != null) body.put("username", username);
        if (password != null) body.put("password", password);
        if (includeSystem != null) body.put("includeSystem", includeSystem);
        if (restrictType != null) body.put("restrictType", restrictType);
        if (restrictCollections != null) body.put("restrictCollections", restrictCollections);

        return put("/replication/make-follower", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully made server a follower"));
    }
}
