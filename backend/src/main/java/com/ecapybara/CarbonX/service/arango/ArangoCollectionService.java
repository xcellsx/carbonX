package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for ArangoDB Collection operations.
 * Provides methods for creating, reading, updating, and deleting collections.
 */
@Slf4j
@Service
public class ArangoCollectionService extends BaseArangoService {

    // ==================== Collection CRUD ====================

    /**
     * List all collections in the database
     * GET /_api/collection
     */
    public Mono<Map> listCollections(Boolean excludeSystem) {
        log.info("Listing collections - excludeSystem: {}", excludeSystem);
        String uri = excludeSystem != null && excludeSystem 
            ? "/collection?excludeSystem=true" 
            : "/collection";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully listed collections"));
    }

    /**
     * Create a new collection
     * POST /_api/collection
     */
    public Mono<Map> createCollection(String name, Integer type, Boolean waitForSync,
                                       Integer numberOfShards, Integer replicationFactor,
                                       Map<String, Object> keyOptions, String shardingStrategy) {
        log.info("Creating collection: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        
        if (type != null) body.put("type", type); // 2 = document, 3 = edge
        if (waitForSync != null) body.put("waitForSync", waitForSync);
        if (numberOfShards != null) body.put("numberOfShards", numberOfShards);
        if (replicationFactor != null) body.put("replicationFactor", replicationFactor);
        if (keyOptions != null) body.put("keyOptions", keyOptions);
        if (shardingStrategy != null) body.put("shardingStrategy", shardingStrategy);

        return post("/collection", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created collection: {}", name));
    }

    /**
     * Drop a collection
     * DELETE /_api/collection/{collection-name}
     */
    public Mono<Map> dropCollection(String collectionName, Boolean isSystem) {
        log.info("Dropping collection: {}", collectionName);
        String uri = isSystem != null && isSystem 
            ? "/collection/" + collectionName + "?isSystem=true"
            : "/collection/" + collectionName;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully dropped collection: {}", collectionName));
    }

    /**
     * Get collection information
     * GET /_api/collection/{collection-name}
     */
    public Mono<Map> getCollection(String collectionName) {
        log.info("Getting collection info: {}", collectionName);
        return get("/collection/{name}", Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully retrieved collection: {}", collectionName));
    }

    /**
     * Get collection properties
     * GET /_api/collection/{collection-name}/properties
     */
    public Mono<Map> getCollectionProperties(String collectionName) {
        log.info("Getting collection properties: {}", collectionName);
        return get("/collection/{name}/properties", Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully retrieved collection properties: {}", collectionName));
    }

    /**
     * Update collection properties
     * PUT /_api/collection/{collection-name}/properties
     */
    public Mono<Map> updateCollectionProperties(String collectionName, Boolean waitForSync,
                                                  String schema, Boolean cacheEnabled,
                                                  Integer replicationFactor, Integer writeConcern) {
        log.info("Updating collection properties: {}", collectionName);
        
        Map<String, Object> body = new HashMap<>();
        if (waitForSync != null) body.put("waitForSync", waitForSync);
        if (schema != null) body.put("schema", schema);
        if (cacheEnabled != null) body.put("cacheEnabled", cacheEnabled);
        if (replicationFactor != null) body.put("replicationFactor", replicationFactor);
        if (writeConcern != null) body.put("writeConcern", writeConcern);

        return put("/collection/{name}/properties", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully updated collection properties: {}", collectionName));
    }

    /**
     * Get document count of a collection
     * GET /_api/collection/{collection-name}/count
     */
    public Mono<Map> getCollectionCount(String collectionName) {
        log.info("Getting document count for collection: {}", collectionName);
        return get("/collection/{name}/count", Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully retrieved count for collection: {}", collectionName));
    }

    /**
     * Get collection statistics (figures)
     * GET /_api/collection/{collection-name}/figures
     */
    public Mono<Map> getCollectionFigures(String collectionName, Boolean details) {
        log.info("Getting collection figures: {}", collectionName);
        String uri = details != null && details 
            ? "/collection/" + collectionName + "/figures?details=true"
            : "/collection/" + collectionName + "/figures";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved figures for collection: {}", collectionName));
    }

    /**
     * Get collection revision ID
     * GET /_api/collection/{collection-name}/revision
     */
    public Mono<Map> getCollectionRevision(String collectionName) {
        log.info("Getting collection revision: {}", collectionName);
        return get("/collection/{name}/revision", Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully retrieved revision for collection: {}", collectionName));
    }

    /**
     * Get collection checksum
     * GET /_api/collection/{collection-name}/checksum
     */
    public Mono<Map> getCollectionChecksum(String collectionName, Boolean withRevisions, Boolean withData) {
        log.info("Getting collection checksum: {}", collectionName);
        StringBuilder uri = new StringBuilder("/collection/" + collectionName + "/checksum");
        String separator = "?";
        if (withRevisions != null) {
            uri.append(separator).append("withRevisions=").append(withRevisions);
            separator = "&";
        }
        if (withData != null) {
            uri.append(separator).append("withData=").append(withData);
        }
        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved checksum for collection: {}", collectionName));
    }

    // ==================== Collection Operations ====================

    /**
     * Truncate (empty) a collection
     * PUT /_api/collection/{collection-name}/truncate
     */
    public Mono<Map> truncateCollection(String collectionName, Boolean waitForSync) {
        log.info("Truncating collection: {}", collectionName);
        Map<String, Object> body = new HashMap<>();
        if (waitForSync != null) body.put("waitForSync", waitForSync);
        return put("/collection/{name}/truncate", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully truncated collection: {}", collectionName));
    }

    /**
     * Load a collection into memory
     * PUT /_api/collection/{collection-name}/load
     */
    public Mono<Map> loadCollection(String collectionName) {
        log.info("Loading collection: {}", collectionName);
        return put("/collection/{name}/load", new HashMap<>(), Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully loaded collection: {}", collectionName));
    }

    /**
     * Unload a collection from memory
     * PUT /_api/collection/{collection-name}/unload
     */
    public Mono<Map> unloadCollection(String collectionName) {
        log.info("Unloading collection: {}", collectionName);
        return put("/collection/{name}/unload", new HashMap<>(), Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully unloaded collection: {}", collectionName));
    }

    /**
     * Load collection indexes into memory
     * PUT /_api/collection/{collection-name}/loadIndexesIntoMemory
     */
    public Mono<Map> loadIndexesIntoMemory(String collectionName) {
        log.info("Loading indexes into memory for collection: {}", collectionName);
        return put("/collection/{name}/loadIndexesIntoMemory", new HashMap<>(), Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully loaded indexes for collection: {}", collectionName));
    }

    /**
     * Compact a collection
     * PUT /_api/collection/{collection-name}/compact
     */
    public Mono<Map> compactCollection(String collectionName) {
        log.info("Compacting collection: {}", collectionName);
        return put("/collection/{name}/compact", new HashMap<>(), Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully compacted collection: {}", collectionName));
    }

    /**
     * Rename a collection
     * PUT /_api/collection/{collection-name}/rename
     */
    public Mono<Map> renameCollection(String collectionName, String newName) {
        log.info("Renaming collection {} to {}", collectionName, newName);
        Map<String, Object> body = new HashMap<>();
        body.put("name", newName);
        return put("/collection/{name}/rename", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully renamed collection {} to {}", collectionName, newName));
    }

    /**
     * Recalculate the document count
     * PUT /_api/collection/{collection-name}/recalculateCount
     */
    public Mono<Map> recalculateCount(String collectionName) {
        log.info("Recalculating count for collection: {}", collectionName);
        return put("/collection/{name}/recalculateCount", new HashMap<>(), Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully recalculated count for collection: {}", collectionName));
    }

    // ==================== Cluster Operations ====================

    /**
     * Get shard IDs of a collection (cluster only)
     * GET /_api/collection/{collection-name}/shards
     */
    public Mono<Map> getShards(String collectionName, Boolean details) {
        log.info("Getting shards for collection: {}", collectionName);
        String uri = details != null && details 
            ? "/collection/" + collectionName + "/shards?details=true"
            : "/collection/" + collectionName + "/shards";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved shards for collection: {}", collectionName));
    }

    /**
     * Get responsible shard for a document (cluster only)
     * PUT /_api/collection/{collection-name}/responsibleShard
     */
    public Mono<Map> getResponsibleShard(String collectionName, Map<String, Object> document) {
        log.info("Getting responsible shard for document in collection: {}", collectionName);
        return put("/collection/{name}/responsibleShard", document, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully retrieved responsible shard for collection: {}", collectionName));
    }

    /**
     * Get available key generators
     * GET /_api/key-generators
     */
    public Mono<Map> getKeyGenerators() {
        log.info("Getting available key generators");
        return get("/key-generators", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved key generators"));
    }
}
