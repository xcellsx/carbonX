package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Index operations.
 * Provides methods for creating, reading, and deleting indexes.
 */
@Slf4j
@Service
public class ArangoIndexService extends BaseArangoService {

    // ==================== Index CRUD ====================

    /**
     * List all indexes of a collection
     * GET /_api/index?collection={collection}
     */
    public Mono<Map> listIndexes(String collectionName) {
        log.info("Listing indexes for collection: {}", collectionName);
        return get("/index?collection={collection}", Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully listed indexes for collection: {}", collectionName));
    }

    /**
     * Get an index by ID
     * GET /_api/index/{index-id}
     */
    public Mono<Map> getIndex(String indexId) {
        log.info("Getting index: {}", indexId);
        return get("/index/{id}", Map.class, indexId)
                .doOnSuccess(result -> log.info("Successfully retrieved index: {}", indexId));
    }

    /**
     * Delete an index
     * DELETE /_api/index/{index-id}
     */
    public Mono<Map> deleteIndex(String indexId) {
        log.info("Deleting index: {}", indexId);
        return delete("/index/{id}", Map.class, indexId)
                .doOnSuccess(result -> log.info("Successfully deleted index: {}", indexId));
    }

    // ==================== Create Indexes ====================

    /**
     * Create a persistent index
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createPersistentIndex(String collectionName, List<String> fields,
                                            Boolean unique, Boolean sparse, Boolean deduplicate,
                                            Boolean estimates, Boolean cacheEnabled, 
                                            List<String> storedValues, Boolean inBackground) {
        log.info("Creating persistent index on collection: {}, fields: {}", collectionName, fields);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "persistent");
        body.put("fields", fields);
        
        if (unique != null) body.put("unique", unique);
        if (sparse != null) body.put("sparse", sparse);
        if (deduplicate != null) body.put("deduplicate", deduplicate);
        if (estimates != null) body.put("estimates", estimates);
        if (cacheEnabled != null) body.put("cacheEnabled", cacheEnabled);
        if (storedValues != null) body.put("storedValues", storedValues);
        if (inBackground != null) body.put("inBackground", inBackground);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created persistent index on collection: {}", collectionName));
    }

    /**
     * Create a geo-spatial index
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createGeoIndex(String collectionName, List<String> fields,
                                     Boolean geoJson, Boolean legacyPolygons,
                                     Boolean inBackground) {
        log.info("Creating geo index on collection: {}, fields: {}", collectionName, fields);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "geo");
        body.put("fields", fields);
        
        if (geoJson != null) body.put("geoJson", geoJson);
        if (legacyPolygons != null) body.put("legacyPolygons", legacyPolygons);
        if (inBackground != null) body.put("inBackground", inBackground);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created geo index on collection: {}", collectionName));
    }

    /**
     * Create a full-text index (deprecated in favor of ArangoSearch)
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createFulltextIndex(String collectionName, List<String> fields,
                                          Integer minLength, Boolean inBackground) {
        log.info("Creating fulltext index on collection: {}, fields: {}", collectionName, fields);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "fulltext");
        body.put("fields", fields);
        
        if (minLength != null) body.put("minLength", minLength);
        if (inBackground != null) body.put("inBackground", inBackground);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created fulltext index on collection: {}", collectionName));
    }

    /**
     * Create a TTL (time-to-live) index
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createTtlIndex(String collectionName, List<String> fields,
                                     Integer expireAfter, Boolean inBackground) {
        log.info("Creating TTL index on collection: {}, fields: {}", collectionName, fields);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "ttl");
        body.put("fields", fields);
        body.put("expireAfter", expireAfter != null ? expireAfter : 0);
        
        if (inBackground != null) body.put("inBackground", inBackground);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created TTL index on collection: {}", collectionName));
    }

    /**
     * Create an inverted index
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createInvertedIndex(String collectionName, List<Map<String, Object>> fields,
                                          String analyzer, Boolean searchField, Boolean cache,
                                          List<String> storedValues, Map<String, Object> primarySort,
                                          Boolean inBackground) {
        log.info("Creating inverted index on collection: {}", collectionName);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "inverted");
        body.put("fields", fields);
        
        if (analyzer != null) body.put("analyzer", analyzer);
        if (searchField != null) body.put("searchField", searchField);
        if (cache != null) body.put("cache", cache);
        if (storedValues != null) body.put("storedValues", storedValues);
        if (primarySort != null) body.put("primarySort", primarySort);
        if (inBackground != null) body.put("inBackground", inBackground);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created inverted index on collection: {}", collectionName));
    }

    /**
     * Create a multi-dimensional index (MDI)
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createMdiIndex(String collectionName, List<String> fields,
                                     String fieldValueTypes, Boolean unique, Boolean sparse,
                                     List<String> storedValues, Boolean inBackground,
                                     Boolean prefixFields) {
        log.info("Creating MDI index on collection: {}, fields: {}", collectionName, fields);
        
        Map<String, Object> body = new HashMap<>();
        body.put("type", "mdi");
        body.put("fields", fields);
        body.put("fieldValueTypes", fieldValueTypes != null ? fieldValueTypes : "double");
        
        if (unique != null) body.put("unique", unique);
        if (sparse != null) body.put("sparse", sparse);
        if (storedValues != null) body.put("storedValues", storedValues);
        if (inBackground != null) body.put("inBackground", inBackground);
        if (prefixFields != null) body.put("prefixFields", prefixFields);

        return post("/index?collection={collection}", body, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created MDI index on collection: {}", collectionName));
    }

    /**
     * Create a generic index (specify type manually)
     * POST /_api/index?collection={collection}
     */
    public Mono<Map> createIndex(String collectionName, Map<String, Object> indexDefinition) {
        log.info("Creating index on collection: {}, definition: {}", collectionName, indexDefinition);
        return post("/index?collection={collection}", indexDefinition, Map.class, collectionName)
                .doOnSuccess(result -> log.info("Successfully created index on collection: {}", collectionName));
    }
}
