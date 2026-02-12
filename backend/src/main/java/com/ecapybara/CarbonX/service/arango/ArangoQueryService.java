package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Query (AQL) operations.
 * Provides methods for executing queries, managing cursors, and query cache.
 */
@Slf4j
@Service
public class ArangoQueryService extends BaseArangoService {

    // ==================== Cursor Operations ====================

    /**
     * Execute an AQL query (create cursor)
     * POST /_api/cursor
     */
    public Mono<Map> executeQuery(String query, Map<String, String> bindVars, 
                                   Integer batchSize, Integer ttl, Boolean count,
                                   Map<String, Object> options) {
        log.info("Executing AQL query: {}", query);
        
        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        
        if (bindVars != null && !bindVars.isEmpty()) body.put("bindVars", bindVars);
        if (batchSize != null) body.put("batchSize", batchSize);
        if (ttl != null) body.put("ttl", ttl);
        if (count != null) body.put("count", count);
        if (options != null) body.put("options", options);

        return post("/cursor", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully executed query"));
    }

    /**
     * Read next batch from cursor
     * POST /_api/cursor/{cursor-identifier}
     */
    public Mono<Map> getNextBatch(String cursorId) {
        log.info("Getting next batch for cursor: {}", cursorId);
        return post("/cursor/{id}", new HashMap<>(), Map.class, cursorId)
                .doOnSuccess(result -> log.info("Successfully retrieved next batch for cursor: {}", cursorId));
    }

    /**
     * Read a batch from cursor again
     * POST /_api/cursor/{cursor-identifier}/{batch-identifier}
     */
    public Mono<Map> getBatch(String cursorId, String batchId) {
        log.info("Getting batch {} for cursor: {}", batchId, cursorId);
        return post("/cursor/{cursorId}/{batchId}", new HashMap<>(), Map.class, cursorId, batchId)
                .doOnSuccess(result -> log.info("Successfully retrieved batch {} for cursor: {}", batchId, cursorId));
    }

    /**
     * Delete a cursor
     * DELETE /_api/cursor/{cursor-identifier}
     */
    public Mono<Map> deleteCursor(String cursorId) {
        log.info("Deleting cursor: {}", cursorId);
        return delete("/cursor/{id}", Map.class, cursorId)
                .doOnSuccess(result -> log.info("Successfully deleted cursor: {}", cursorId));
    }

    // ==================== Query Analysis ====================

    /**
     * Parse an AQL query (validate syntax)
     * POST /_api/query
     */
    public Mono<Map> parseQuery(String query) {
        log.info("Parsing AQL query");
        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        return post("/query", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully parsed query"));
    }

    /**
     * Explain an AQL query (get execution plan)
     * POST /_api/explain
     */
    public Mono<Map> explainQuery(String query, Map<String, Object> bindVars,
                                   Map<String, Object> options, Boolean allPlans) {
        log.info("Explaining AQL query");
        
        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        
        if (bindVars != null && !bindVars.isEmpty()) body.put("bindVars", bindVars);
        if (options != null) body.put("options", options);
        if (allPlans != null) {
            Map<String, Object> opts = options != null ? new HashMap<>(options) : new HashMap<>();
            opts.put("allPlans", allPlans);
            body.put("options", opts);
        }

        return post("/explain", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully explained query"));
    }

    /**
     * List all AQL optimizer rules
     * GET /_api/query/rules
     */
    public Mono<Map> getOptimizerRules() {
        log.info("Getting AQL optimizer rules");
        return get("/query/rules", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved optimizer rules"));
    }

    // ==================== Query Tracking ====================

    /**
     * List running AQL queries
     * GET /_api/query/current
     */
    public Mono<Map> getRunningQueries(Boolean all) {
        log.info("Getting running queries - all: {}", all);
        String uri = all != null && all ? "/query/current?all=true" : "/query/current";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved running queries"));
    }

    /**
     * List slow AQL queries
     * GET /_api/query/slow
     */
    public Mono<Map> getSlowQueries(Boolean all) {
        log.info("Getting slow queries - all: {}", all);
        String uri = all != null && all ? "/query/slow?all=true" : "/query/slow";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved slow queries"));
    }

    /**
     * Clear slow query list
     * DELETE /_api/query/slow
     */
    public Mono<Map> clearSlowQueries(Boolean all) {
        log.info("Clearing slow queries - all: {}", all);
        String uri = all != null && all ? "/query/slow?all=true" : "/query/slow";
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully cleared slow queries"));
    }

    /**
     * Kill a running AQL query
     * DELETE /_api/query/{query-id}
     */
    public Mono<Map> killQuery(String queryId, Boolean all) {
        log.info("Killing query: {} - all: {}", queryId, all);
        String uri = all != null && all 
            ? "/query/" + queryId + "?all=true"
            : "/query/" + queryId;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully killed query: {}", queryId));
    }

    /**
     * Get AQL query tracking configuration
     * GET /_api/query/properties
     */
    public Mono<Map> getQueryTrackingConfig() {
        log.info("Getting query tracking configuration");
        return get("/query/properties", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved query tracking config"));
    }

    /**
     * Update AQL query tracking configuration
     * PUT /_api/query/properties
     */
    public Mono<Map> updateQueryTrackingConfig(Boolean enabled, Boolean trackSlowQueries,
                                                Boolean trackBindVars, Long maxSlowQueries,
                                                Double slowQueryThreshold, Long maxQueryStringLength) {
        log.info("Updating query tracking configuration");
        
        Map<String, Object> body = new HashMap<>();
        if (enabled != null) body.put("enabled", enabled);
        if (trackSlowQueries != null) body.put("trackSlowQueries", trackSlowQueries);
        if (trackBindVars != null) body.put("trackBindVars", trackBindVars);
        if (maxSlowQueries != null) body.put("maxSlowQueries", maxSlowQueries);
        if (slowQueryThreshold != null) body.put("slowQueryThreshold", slowQueryThreshold);
        if (maxQueryStringLength != null) body.put("maxQueryStringLength", maxQueryStringLength);

        return put("/query/properties", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully updated query tracking config"));
    }

    // ==================== Query Cache ====================

    /**
     * List entries of the AQL query results cache
     * GET /_api/query-cache/entries
     */
    public Mono<Map> getQueryCacheEntries() {
        log.info("Getting query cache entries");
        return get("/query-cache/entries", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved query cache entries"));
    }

    /**
     * Get AQL query results cache configuration
     * GET /_api/query-cache/properties
     */
    public Mono<Map> getQueryCacheConfig() {
        log.info("Getting query cache configuration");
        return get("/query-cache/properties", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved query cache config"));
    }

    /**
     * Update AQL query results cache configuration
     * PUT /_api/query-cache/properties
     */
    public Mono<Map> updateQueryCacheConfig(String mode, Long maxResults, 
                                             Long maxResultsSize, Long maxEntrySize,
                                             Boolean includeSystem) {
        log.info("Updating query cache configuration");
        
        Map<String, Object> body = new HashMap<>();
        if (mode != null) body.put("mode", mode); // "off", "on", "demand"
        if (maxResults != null) body.put("maxResults", maxResults);
        if (maxResultsSize != null) body.put("maxResultsSize", maxResultsSize);
        if (maxEntrySize != null) body.put("maxEntrySize", maxEntrySize);
        if (includeSystem != null) body.put("includeSystem", includeSystem);

        return put("/query-cache/properties", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully updated query cache config"));
    }

    /**
     * Clear the AQL query results cache
     * DELETE /_api/query-cache
     */
    public Mono<Map> clearQueryCache() {
        log.info("Clearing query cache");
        return delete("/query-cache", Map.class)
                .doOnSuccess(result -> log.info("Successfully cleared query cache"));
    }

    // ==================== Query Plan Cache ====================

    /**
     * List entries of the AQL query plan cache
     * GET /_api/query-plan-cache
     */
    public Mono<Map> getQueryPlanCache() {
        log.info("Getting query plan cache entries");
        return get("/query-plan-cache", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved query plan cache entries"));
    }

    /**
     * Clear the AQL query plan cache
     * DELETE /_api/query-plan-cache
     */
    public Mono<Map> clearQueryPlanCache() {
        log.info("Clearing query plan cache");
        return delete("/query-plan-cache", Map.class)
                .doOnSuccess(result -> log.info("Successfully cleared query plan cache"));
    }

    // ==================== User-Defined Functions ====================

    /**
     * List registered user-defined AQL functions
     * GET /_api/aqlfunction
     */
    public Mono<Map> listAqlFunctions(String namespace) {
        log.info("Listing AQL functions - namespace: {}", namespace);
        String uri = namespace != null && !namespace.isEmpty() 
            ? "/aqlfunction?namespace=" + namespace 
            : "/aqlfunction";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully listed AQL functions"));
    }

    /**
     * Create a user-defined AQL function
     * POST /_api/aqlfunction
     */
    public Mono<Map> createAqlFunction(String name, String code, Boolean isDeterministic) {
        log.info("Creating AQL function: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("code", code);
        if (isDeterministic != null) body.put("isDeterministic", isDeterministic);

        return post("/aqlfunction", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created AQL function: {}", name));
    }

    /**
     * Remove a user-defined AQL function
     * DELETE /_api/aqlfunction/{name}
     */
    public Mono<Map> deleteAqlFunction(String name, Boolean group) {
        log.info("Deleting AQL function: {} - group: {}", name, group);
        String uri = group != null && group 
            ? "/aqlfunction/" + name + "?group=true"
            : "/aqlfunction/" + name;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully deleted AQL function: {}", name));
    }
}
