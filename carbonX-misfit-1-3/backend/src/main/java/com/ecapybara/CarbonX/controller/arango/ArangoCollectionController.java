package com.ecapybara.CarbonX.controller.arango;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoCollectionService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Collection operations.
 * Base path: /api/arango/collections
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/collections")
public class ArangoCollectionController {

    @Autowired
    private ArangoCollectionService collectionService;

    // ==================== Collection CRUD ====================

    @GetMapping
    public Mono<Map> listCollections(
            @RequestParam(required = false) Boolean excludeSystem) {
        return collectionService.listCollections(excludeSystem);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createCollection(
            @RequestParam String name,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Integer numberOfShards,
            @RequestParam(required = false) Integer replicationFactor,
            @RequestBody(required = false) Map<String, Object> options) {
        Map<String, Object> keyOptions = options != null ? 
            (Map<String, Object>) options.get("keyOptions") : null;
        String shardingStrategy = options != null ? 
            (String) options.get("shardingStrategy") : null;
        return collectionService.createCollection(name, type, waitForSync, 
            numberOfShards, replicationFactor, keyOptions, shardingStrategy);
    }

    @GetMapping("/{name}")
    public Mono<Map> getCollection(@PathVariable String name) {
        return collectionService.getCollection(name);
    }

    @DeleteMapping("/{name}")
    public Mono<Map> dropCollection(
            @PathVariable String name,
            @RequestParam(required = false) Boolean isSystem) {
        return collectionService.dropCollection(name, isSystem);
    }

    // ==================== Collection Properties ====================

    @GetMapping("/{name}/properties")
    public Mono<Map> getCollectionProperties(@PathVariable String name) {
        return collectionService.getCollectionProperties(name);
    }

    @PutMapping("/{name}/properties")
    public Mono<Map> updateCollectionProperties(
            @PathVariable String name,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) String schema,
            @RequestParam(required = false) Boolean cacheEnabled,
            @RequestParam(required = false) Integer replicationFactor,
            @RequestParam(required = false) Integer writeConcern) {
        return collectionService.updateCollectionProperties(name, waitForSync, 
            schema, cacheEnabled, replicationFactor, writeConcern);
    }

    @GetMapping("/{name}/count")
    public Mono<Map> getCollectionCount(@PathVariable String name) {
        return collectionService.getCollectionCount(name);
    }

    @GetMapping("/{name}/figures")
    public Mono<Map> getCollectionFigures(
            @PathVariable String name,
            @RequestParam(required = false) Boolean details) {
        return collectionService.getCollectionFigures(name, details);
    }

    @GetMapping("/{name}/revision")
    public Mono<Map> getCollectionRevision(@PathVariable String name) {
        return collectionService.getCollectionRevision(name);
    }

    @GetMapping("/{name}/checksum")
    public Mono<Map> getCollectionChecksum(
            @PathVariable String name,
            @RequestParam(required = false) Boolean withRevisions,
            @RequestParam(required = false) Boolean withData) {
        return collectionService.getCollectionChecksum(name, withRevisions, withData);
    }

    // ==================== Collection Operations ====================

    @PutMapping("/{name}/truncate")
    public Mono<Map> truncateCollection(
            @PathVariable String name,
            @RequestParam(required = false) Boolean waitForSync) {
        return collectionService.truncateCollection(name, waitForSync);
    }

    @PutMapping("/{name}/load")
    public Mono<Map> loadCollection(@PathVariable String name) {
        return collectionService.loadCollection(name);
    }

    @PutMapping("/{name}/unload")
    public Mono<Map> unloadCollection(@PathVariable String name) {
        return collectionService.unloadCollection(name);
    }

    @PutMapping("/{name}/loadIndexes")
    public Mono<Map> loadIndexesIntoMemory(@PathVariable String name) {
        return collectionService.loadIndexesIntoMemory(name);
    }

    @PutMapping("/{name}/compact")
    public Mono<Map> compactCollection(@PathVariable String name) {
        return collectionService.compactCollection(name);
    }

    @PutMapping("/{name}/rename")
    public Mono<Map> renameCollection(
            @PathVariable String name,
            @RequestParam String newName) {
        return collectionService.renameCollection(name, newName);
    }

    @PutMapping("/{name}/recalculateCount")
    public Mono<Map> recalculateCount(@PathVariable String name) {
        return collectionService.recalculateCount(name);
    }

    // ==================== Cluster Operations ====================

    @GetMapping("/{name}/shards")
    public Mono<Map> getShards(
            @PathVariable String name,
            @RequestParam(required = false) Boolean details) {
        return collectionService.getShards(name, details);
    }

    @PutMapping("/{name}/responsibleShard")
    public Mono<Map> getResponsibleShard(
            @PathVariable String name,
            @RequestBody Map<String, Object> document) {
        return collectionService.getResponsibleShard(name, document);
    }

    @GetMapping("/key-generators")
    public Mono<Map> getKeyGenerators() {
        return collectionService.getKeyGenerators();
    }
}
