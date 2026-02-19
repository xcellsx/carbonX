package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoViewService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB View (ArangoSearch) operations.
 * Base path: /api/arango/views
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/views")
public class ArangoViewController {

    @Autowired
    private ArangoViewService viewService;

    // ==================== View CRUD ====================

    @GetMapping
    public Mono<Map> listViews() {
        return viewService.listViews();
    }

    @PostMapping("/arangosearch")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createArangoSearchView(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        Map<String, Object> links = (Map<String, Object>) request.get("links");
        Map<String, Object> primarySort = (Map<String, Object>) request.get("primarySort");
        List<String> storedValues = (List<String>) request.get("storedValues");
        Integer cleanupIntervalStep = (Integer) request.get("cleanupIntervalStep");
        Integer commitIntervalMsec = (Integer) request.get("commitIntervalMsec");
        Integer consolidationIntervalMsec = (Integer) request.get("consolidationIntervalMsec");
        Map<String, Object> consolidationPolicy = (Map<String, Object>) request.get("consolidationPolicy");
        
        return viewService.createArangoSearchView(name, links, primarySort, storedValues,
            cleanupIntervalStep, commitIntervalMsec, consolidationIntervalMsec, consolidationPolicy);
    }

    @PostMapping("/search-alias")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createSearchAliasView(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<Map<String, Object>> indexes = (List<Map<String, Object>>) request.get("indexes");
        
        return viewService.createSearchAliasView(name, indexes);
    }

    @GetMapping("/{viewName}")
    public Mono<Map> getView(@PathVariable String viewName) {
        return viewService.getView(viewName);
    }

    @GetMapping("/{viewName}/properties")
    public Mono<Map> getViewProperties(@PathVariable String viewName) {
        return viewService.getViewProperties(viewName);
    }

    @DeleteMapping("/{viewName}")
    public Mono<Map> dropView(@PathVariable String viewName) {
        return viewService.dropView(viewName);
    }

    @PutMapping("/{viewName}/rename")
    public Mono<Map> renameView(
            @PathVariable String viewName,
            @RequestParam String newName) {
        return viewService.renameView(viewName, newName);
    }

    // ==================== ArangoSearch View Properties ====================

    @PatchMapping("/{viewName}/properties/arangosearch")
    public Mono<Map> updateArangoSearchViewProperties(
            @PathVariable String viewName,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> links = (Map<String, Object>) request.get("links");
        Integer cleanupIntervalStep = (Integer) request.get("cleanupIntervalStep");
        Integer commitIntervalMsec = (Integer) request.get("commitIntervalMsec");
        Integer consolidationIntervalMsec = (Integer) request.get("consolidationIntervalMsec");
        Map<String, Object> consolidationPolicy = (Map<String, Object>) request.get("consolidationPolicy");
        
        return viewService.updateArangoSearchViewProperties(viewName, links, 
            cleanupIntervalStep, commitIntervalMsec, consolidationIntervalMsec, consolidationPolicy);
    }

    @PutMapping("/{viewName}/properties/arangosearch")
    public Mono<Map> replaceArangoSearchViewProperties(
            @PathVariable String viewName,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> links = (Map<String, Object>) request.get("links");
        Integer cleanupIntervalStep = (Integer) request.get("cleanupIntervalStep");
        Integer commitIntervalMsec = (Integer) request.get("commitIntervalMsec");
        Integer consolidationIntervalMsec = (Integer) request.get("consolidationIntervalMsec");
        Map<String, Object> consolidationPolicy = (Map<String, Object>) request.get("consolidationPolicy");
        
        return viewService.replaceArangoSearchViewProperties(viewName, links, 
            cleanupIntervalStep, commitIntervalMsec, consolidationIntervalMsec, consolidationPolicy);
    }

    // ==================== Search-Alias View Properties ====================

    @PatchMapping("/{viewName}/properties/search-alias")
    public Mono<Map> updateSearchAliasViewProperties(
            @PathVariable String viewName,
            @RequestBody Map<String, Object> request) {
        List<Map<String, Object>> indexes = (List<Map<String, Object>>) request.get("indexes");
        return viewService.updateSearchAliasViewProperties(viewName, indexes);
    }

    @PutMapping("/{viewName}/properties/search-alias")
    public Mono<Map> replaceSearchAliasViewProperties(
            @PathVariable String viewName,
            @RequestBody Map<String, Object> request) {
        List<Map<String, Object>> indexes = (List<Map<String, Object>>) request.get("indexes");
        return viewService.replaceSearchAliasViewProperties(viewName, indexes);
    }
}
