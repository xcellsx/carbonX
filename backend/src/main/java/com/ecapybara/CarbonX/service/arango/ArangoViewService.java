package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB View operations (ArangoSearch).
 * Provides methods for creating and managing Views for full-text search.
 */
@Slf4j
@Service
public class ArangoViewService extends BaseArangoService {

    // ==================== View CRUD ====================

    /**
     * List all views
     * GET /_api/view
     */
    public Mono<Map> listViews() {
        log.info("Listing all views");
        return get("/view", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed views"));
    }

    /**
     * Create an arangosearch view
     * POST /_api/view
     */
    public Mono<Map> createArangoSearchView(String name, Map<String, Object> links,
                                             Map<String, Object> primarySort,
                                             List<String> storedValues,
                                             Integer cleanupIntervalStep,
                                             Integer commitIntervalMsec,
                                             Integer consolidationIntervalMsec,
                                             Map<String, Object> consolidationPolicy) {
        log.info("Creating arangosearch view: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("type", "arangosearch");
        
        if (links != null) body.put("links", links);
        if (primarySort != null) body.put("primarySort", primarySort);
        if (storedValues != null) body.put("storedValues", storedValues);
        if (cleanupIntervalStep != null) body.put("cleanupIntervalStep", cleanupIntervalStep);
        if (commitIntervalMsec != null) body.put("commitIntervalMsec", commitIntervalMsec);
        if (consolidationIntervalMsec != null) body.put("consolidationIntervalMsec", consolidationIntervalMsec);
        if (consolidationPolicy != null) body.put("consolidationPolicy", consolidationPolicy);

        return post("/view", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created arangosearch view: {}", name));
    }

    /**
     * Create a search-alias view
     * POST /_api/view
     */
    public Mono<Map> createSearchAliasView(String name, List<Map<String, Object>> indexes) {
        log.info("Creating search-alias view: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("type", "search-alias");
        if (indexes != null) body.put("indexes", indexes);

        return post("/view", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created search-alias view: {}", name));
    }

    /**
     * Get view information
     * GET /_api/view/{view-name}
     */
    public Mono<Map> getView(String viewName) {
        log.info("Getting view: {}", viewName);
        return get("/view/{name}", Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully retrieved view: {}", viewName));
    }

    /**
     * Get view properties
     * GET /_api/view/{view-name}/properties
     */
    public Mono<Map> getViewProperties(String viewName) {
        log.info("Getting view properties: {}", viewName);
        return get("/view/{name}/properties", Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully retrieved view properties: {}", viewName));
    }

    /**
     * Drop a view
     * DELETE /_api/view/{view-name}
     */
    public Mono<Map> dropView(String viewName) {
        log.info("Dropping view: {}", viewName);
        return delete("/view/{name}", Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully dropped view: {}", viewName));
    }

    /**
     * Rename a view
     * PUT /_api/view/{view-name}/rename
     */
    public Mono<Map> renameView(String viewName, String newName) {
        log.info("Renaming view {} to {}", viewName, newName);
        Map<String, Object> body = new HashMap<>();
        body.put("name", newName);
        return put("/view/{name}/rename", body, Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully renamed view {} to {}", viewName, newName));
    }

    // ==================== ArangoSearch View Properties ====================

    /**
     * Update arangosearch view properties (partial update)
     * PATCH /_api/view/{view-name}/properties
     */
    public Mono<Map> updateArangoSearchViewProperties(String viewName,
                                                       Map<String, Object> links,
                                                       Integer cleanupIntervalStep,
                                                       Integer commitIntervalMsec,
                                                       Integer consolidationIntervalMsec,
                                                       Map<String, Object> consolidationPolicy) {
        log.info("Updating arangosearch view properties: {}", viewName);
        
        Map<String, Object> body = new HashMap<>();
        if (links != null) body.put("links", links);
        if (cleanupIntervalStep != null) body.put("cleanupIntervalStep", cleanupIntervalStep);
        if (commitIntervalMsec != null) body.put("commitIntervalMsec", commitIntervalMsec);
        if (consolidationIntervalMsec != null) body.put("consolidationIntervalMsec", consolidationIntervalMsec);
        if (consolidationPolicy != null) body.put("consolidationPolicy", consolidationPolicy);

        return patch("/view/{name}/properties", body, Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully updated arangosearch view properties: {}", viewName));
    }

    /**
     * Replace arangosearch view properties (full replace)
     * PUT /_api/view/{view-name}/properties
     */
    public Mono<Map> replaceArangoSearchViewProperties(String viewName,
                                                        Map<String, Object> links,
                                                        Integer cleanupIntervalStep,
                                                        Integer commitIntervalMsec,
                                                        Integer consolidationIntervalMsec,
                                                        Map<String, Object> consolidationPolicy) {
        log.info("Replacing arangosearch view properties: {}", viewName);
        
        Map<String, Object> body = new HashMap<>();
        if (links != null) body.put("links", links);
        if (cleanupIntervalStep != null) body.put("cleanupIntervalStep", cleanupIntervalStep);
        if (commitIntervalMsec != null) body.put("commitIntervalMsec", commitIntervalMsec);
        if (consolidationIntervalMsec != null) body.put("consolidationIntervalMsec", consolidationIntervalMsec);
        if (consolidationPolicy != null) body.put("consolidationPolicy", consolidationPolicy);

        return put("/view/{name}/properties", body, Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully replaced arangosearch view properties: {}", viewName));
    }

    // ==================== Search-Alias View Properties ====================

    /**
     * Update search-alias view properties (partial update)
     * PATCH /_api/view/{view-name}/properties
     */
    public Mono<Map> updateSearchAliasViewProperties(String viewName,
                                                      List<Map<String, Object>> indexes) {
        log.info("Updating search-alias view properties: {}", viewName);
        
        Map<String, Object> body = new HashMap<>();
        if (indexes != null) body.put("indexes", indexes);

        return patch("/view/{name}/properties", body, Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully updated search-alias view properties: {}", viewName));
    }

    /**
     * Replace search-alias view properties (full replace)
     * PUT /_api/view/{view-name}/properties
     */
    public Mono<Map> replaceSearchAliasViewProperties(String viewName,
                                                       List<Map<String, Object>> indexes) {
        log.info("Replacing search-alias view properties: {}", viewName);
        
        Map<String, Object> body = new HashMap<>();
        if (indexes != null) body.put("indexes", indexes);

        return put("/view/{name}/properties", body, Map.class, viewName)
                .doOnSuccess(result -> log.info("Successfully replaced search-alias view properties: {}", viewName));
    }
}
