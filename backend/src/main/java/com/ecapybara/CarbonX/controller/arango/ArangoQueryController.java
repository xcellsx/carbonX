package com.ecapybara.CarbonX.controller.arango;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoQueryService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Query (AQL) operations.
 * Base path: /api/arango/query
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/query")
public class ArangoQueryController {

    @Autowired
    private ArangoQueryService queryService;

    // ==================== Query Execution ====================

    @PostMapping("/cursor")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> executeQuery(@RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Map<String, Object> bindVars = (Map<String, Object>) request.get("bindVars");
        Integer batchSize = (Integer) request.get("batchSize");
        Integer ttl = (Integer) request.get("ttl");
        Boolean count = (Boolean) request.get("count");
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        
        return queryService.executeQuery(query, bindVars, batchSize, ttl, count, options);
    }

    @PostMapping("/cursor/{cursorId}")
    public Mono<Map> getNextBatch(@PathVariable String cursorId) {
        return queryService.getNextBatch(cursorId);
    }

    @PostMapping("/cursor/{cursorId}/{batchId}")
    public Mono<Map> getBatch(
            @PathVariable String cursorId,
            @PathVariable String batchId) {
        return queryService.getBatch(cursorId, batchId);
    }

    @DeleteMapping("/cursor/{cursorId}")
    public Mono<Map> deleteCursor(@PathVariable String cursorId) {
        return queryService.deleteCursor(cursorId);
    }

    // ==================== Query Analysis ====================

    @PostMapping("/parse")
    public Mono<Map> parseQuery(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        return queryService.parseQuery(query);
    }

    @PostMapping("/explain")
    public Mono<Map> explainQuery(@RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Map<String, Object> bindVars = (Map<String, Object>) request.get("bindVars");
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        Boolean allPlans = (Boolean) request.get("allPlans");
        
        return queryService.explainQuery(query, bindVars, options, allPlans);
    }

    @GetMapping("/rules")
    public Mono<Map> getOptimizerRules() {
        return queryService.getOptimizerRules();
    }

    // ==================== Query Tracking ====================

    @GetMapping("/current")
    public Mono<Map> getRunningQueries(@RequestParam(required = false) Boolean all) {
        return queryService.getRunningQueries(all);
    }

    @GetMapping("/slow")
    public Mono<Map> getSlowQueries(@RequestParam(required = false) Boolean all) {
        return queryService.getSlowQueries(all);
    }

    @DeleteMapping("/slow")
    public Mono<Map> clearSlowQueries(@RequestParam(required = false) Boolean all) {
        return queryService.clearSlowQueries(all);
    }

    @DeleteMapping("/{queryId}")
    public Mono<Map> killQuery(
            @PathVariable String queryId,
            @RequestParam(required = false) Boolean all) {
        return queryService.killQuery(queryId, all);
    }

    @GetMapping("/properties")
    public Mono<Map> getQueryTrackingConfig() {
        return queryService.getQueryTrackingConfig();
    }

    @PutMapping("/properties")
    public Mono<Map> updateQueryTrackingConfig(@RequestBody Map<String, Object> config) {
        Boolean enabled = (Boolean) config.get("enabled");
        Boolean trackSlowQueries = (Boolean) config.get("trackSlowQueries");
        Boolean trackBindVars = (Boolean) config.get("trackBindVars");
        Long maxSlowQueries = config.get("maxSlowQueries") != null ? 
            ((Number) config.get("maxSlowQueries")).longValue() : null;
        Double slowQueryThreshold = config.get("slowQueryThreshold") != null ? 
            ((Number) config.get("slowQueryThreshold")).doubleValue() : null;
        Long maxQueryStringLength = config.get("maxQueryStringLength") != null ? 
            ((Number) config.get("maxQueryStringLength")).longValue() : null;
        
        return queryService.updateQueryTrackingConfig(enabled, trackSlowQueries, 
            trackBindVars, maxSlowQueries, slowQueryThreshold, maxQueryStringLength);
    }

    // ==================== Query Cache ====================

    @GetMapping("/cache/entries")
    public Mono<Map> getQueryCacheEntries() {
        return queryService.getQueryCacheEntries();
    }

    @GetMapping("/cache/properties")
    public Mono<Map> getQueryCacheConfig() {
        return queryService.getQueryCacheConfig();
    }

    @PutMapping("/cache/properties")
    public Mono<Map> updateQueryCacheConfig(@RequestBody Map<String, Object> config) {
        String mode = (String) config.get("mode");
        Long maxResults = config.get("maxResults") != null ? 
            ((Number) config.get("maxResults")).longValue() : null;
        Long maxResultsSize = config.get("maxResultsSize") != null ? 
            ((Number) config.get("maxResultsSize")).longValue() : null;
        Long maxEntrySize = config.get("maxEntrySize") != null ? 
            ((Number) config.get("maxEntrySize")).longValue() : null;
        Boolean includeSystem = (Boolean) config.get("includeSystem");
        
        return queryService.updateQueryCacheConfig(mode, maxResults, 
            maxResultsSize, maxEntrySize, includeSystem);
    }

    @DeleteMapping("/cache")
    public Mono<Map> clearQueryCache() {
        return queryService.clearQueryCache();
    }

    // ==================== Query Plan Cache ====================

    @GetMapping("/plan-cache")
    public Mono<Map> getQueryPlanCache() {
        return queryService.getQueryPlanCache();
    }

    @DeleteMapping("/plan-cache")
    public Mono<Map> clearQueryPlanCache() {
        return queryService.clearQueryPlanCache();
    }

    // ==================== User-Defined Functions ====================

    @GetMapping("/functions")
    public Mono<Map> listAqlFunctions(@RequestParam(required = false) String namespace) {
        return queryService.listAqlFunctions(namespace);
    }

    @PostMapping("/functions")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createAqlFunction(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String code = (String) request.get("code");
        Boolean isDeterministic = (Boolean) request.get("isDeterministic");
        
        return queryService.createAqlFunction(name, code, isDeterministic);
    }

    @DeleteMapping("/functions/{name}")
    public Mono<Map> deleteAqlFunction(
            @PathVariable String name,
            @RequestParam(required = false) Boolean group) {
        return queryService.deleteAqlFunction(name, group);
    }
}
