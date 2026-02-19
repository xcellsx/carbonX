package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoIndexService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Index operations.
 * Base path: /api/arango/indexes
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/indexes")
public class ArangoIndexController {

    @Autowired
    private ArangoIndexService indexService;

    // ==================== Index CRUD ====================

    @GetMapping
    public Mono<Map> listIndexes(@RequestParam String collection) {
        return indexService.listIndexes(collection);
    }

    @GetMapping("/{indexId}")
    public Mono<Map> getIndex(@PathVariable String indexId) {
        return indexService.getIndex(indexId);
    }

    @DeleteMapping("/{indexId}")
    public Mono<Map> deleteIndex(@PathVariable String indexId) {
        return indexService.deleteIndex(indexId);
    }

    // ==================== Create Indexes ====================

    @PostMapping("/persistent")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createPersistentIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<String> fields = (List<String>) request.get("fields");
        Boolean unique = (Boolean) request.get("unique");
        Boolean sparse = (Boolean) request.get("sparse");
        Boolean deduplicate = (Boolean) request.get("deduplicate");
        Boolean estimates = (Boolean) request.get("estimates");
        Boolean cacheEnabled = (Boolean) request.get("cacheEnabled");
        List<String> storedValues = (List<String>) request.get("storedValues");
        Boolean inBackground = (Boolean) request.get("inBackground");
        
        return indexService.createPersistentIndex(collection, fields, unique, sparse,
            deduplicate, estimates, cacheEnabled, storedValues, inBackground);
    }

    @PostMapping("/geo")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createGeoIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<String> fields = (List<String>) request.get("fields");
        Boolean geoJson = (Boolean) request.get("geoJson");
        Boolean legacyPolygons = (Boolean) request.get("legacyPolygons");
        Boolean inBackground = (Boolean) request.get("inBackground");
        
        return indexService.createGeoIndex(collection, fields, geoJson, 
            legacyPolygons, inBackground);
    }

    @PostMapping("/fulltext")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createFulltextIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<String> fields = (List<String>) request.get("fields");
        Integer minLength = (Integer) request.get("minLength");
        Boolean inBackground = (Boolean) request.get("inBackground");
        
        return indexService.createFulltextIndex(collection, fields, minLength, inBackground);
    }

    @PostMapping("/ttl")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createTtlIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<String> fields = (List<String>) request.get("fields");
        Integer expireAfter = (Integer) request.get("expireAfter");
        Boolean inBackground = (Boolean) request.get("inBackground");
        
        return indexService.createTtlIndex(collection, fields, expireAfter, inBackground);
    }

    @PostMapping("/inverted")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createInvertedIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<Map<String, Object>> fields = (List<Map<String, Object>>) request.get("fields");
        String analyzer = (String) request.get("analyzer");
        Boolean searchField = (Boolean) request.get("searchField");
        Boolean cache = (Boolean) request.get("cache");
        List<String> storedValues = (List<String>) request.get("storedValues");
        Map<String, Object> primarySort = (Map<String, Object>) request.get("primarySort");
        Boolean inBackground = (Boolean) request.get("inBackground");
        
        return indexService.createInvertedIndex(collection, fields, analyzer, searchField,
            cache, storedValues, primarySort, inBackground);
    }

    @PostMapping("/mdi")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createMdiIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> request) {
        List<String> fields = (List<String>) request.get("fields");
        String fieldValueTypes = (String) request.get("fieldValueTypes");
        Boolean unique = (Boolean) request.get("unique");
        Boolean sparse = (Boolean) request.get("sparse");
        List<String> storedValues = (List<String>) request.get("storedValues");
        Boolean inBackground = (Boolean) request.get("inBackground");
        Boolean prefixFields = (Boolean) request.get("prefixFields");
        
        return indexService.createMdiIndex(collection, fields, fieldValueTypes, unique,
            sparse, storedValues, inBackground, prefixFields);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createIndex(
            @RequestParam String collection,
            @RequestBody Map<String, Object> indexDefinition) {
        return indexService.createIndex(collection, indexDefinition);
    }
}
