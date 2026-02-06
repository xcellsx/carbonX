package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoGraphService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Graph (Gharial) operations.
 * Base path: /api/arango/graphs
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/graphs")
public class ArangoGraphController {

    @Autowired
    private ArangoGraphService graphService;

    // ==================== Graph CRUD ====================

    @GetMapping
    public Mono<Map> listGraphs() {
        return graphService.listGraphs();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createGraph(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<Map<String, Object>> edgeDefinitions = (List<Map<String, Object>>) request.get("edgeDefinitions");
        List<String> orphanCollections = (List<String>) request.get("orphanCollections");
        Boolean isSmart = (Boolean) request.get("isSmart");
        Boolean isDisjoint = (Boolean) request.get("isDisjoint");
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        
        return graphService.createGraph(name, edgeDefinitions, orphanCollections, 
            isSmart, isDisjoint, options);
    }

    @GetMapping("/{graphName}")
    public Mono<Map> getGraph(@PathVariable String graphName) {
        return graphService.getGraph(graphName);
    }

    @DeleteMapping("/{graphName}")
    public Mono<Map> dropGraph(
            @PathVariable String graphName,
            @RequestParam(required = false) Boolean dropCollections) {
        return graphService.dropGraph(graphName, dropCollections);
    }

    // ==================== Edge Collections ====================

    @GetMapping("/{graphName}/edge")
    public Mono<Map> listEdgeCollections(@PathVariable String graphName) {
        return graphService.listEdgeCollections(graphName);
    }

    @PostMapping("/{graphName}/edge")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> addEdgeDefinition(
            @PathVariable String graphName,
            @RequestBody Map<String, Object> request) {
        String collection = (String) request.get("collection");
        List<String> from = (List<String>) request.get("from");
        List<String> to = (List<String>) request.get("to");
        
        return graphService.addEdgeDefinition(graphName, collection, from, to);
    }

    @PutMapping("/{graphName}/edge/{collection}")
    public Mono<Map> replaceEdgeDefinition(
            @PathVariable String graphName,
            @PathVariable String collection,
            @RequestBody Map<String, Object> request,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean dropCollections) {
        List<String> from = (List<String>) request.get("from");
        List<String> to = (List<String>) request.get("to");
        
        return graphService.replaceEdgeDefinition(graphName, collection, from, to, 
            waitForSync, dropCollections);
    }

    @DeleteMapping("/{graphName}/edge/{collection}")
    public Mono<Map> removeEdgeDefinition(
            @PathVariable String graphName,
            @PathVariable String collection,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean dropCollections) {
        return graphService.removeEdgeDefinition(graphName, collection, 
            waitForSync, dropCollections);
    }

    // ==================== Vertex Collections ====================

    @GetMapping("/{graphName}/vertex")
    public Mono<Map> listVertexCollections(
            @PathVariable String graphName,
            @RequestParam(required = false) Boolean excludeOrphans) {
        return graphService.listVertexCollections(graphName, excludeOrphans);
    }

    @PostMapping("/{graphName}/vertex")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> addVertexCollection(
            @PathVariable String graphName,
            @RequestBody Map<String, String> request) {
        String collection = request.get("collection");
        return graphService.addVertexCollection(graphName, collection);
    }

    @DeleteMapping("/{graphName}/vertex/{collection}")
    public Mono<Map> removeVertexCollection(
            @PathVariable String graphName,
            @PathVariable String collection,
            @RequestParam(required = false) Boolean dropCollection) {
        return graphService.removeVertexCollection(graphName, collection, dropCollection);
    }

    // ==================== Vertex Operations ====================

    @PostMapping("/{graphName}/vertex/{collection}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createVertex(
            @PathVariable String graphName,
            @PathVariable String collection,
            @RequestBody Object vertex,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew) {
        return graphService.createVertex(graphName, collection, vertex, waitForSync, returnNew);
    }

    @GetMapping("/{graphName}/vertex/{collection}/{vertexKey}")
    public Mono<Map> getVertex(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String vertexKey,
            @RequestParam(required = false) String rev,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        return graphService.getVertex(graphName, collection, vertexKey, rev, ifMatch, ifNoneMatch);
    }

    @PutMapping("/{graphName}/vertex/{collection}/{vertexKey}")
    public Mono<Map> replaceVertex(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String vertexKey,
            @RequestBody Object vertex,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean keepNull) {
        return graphService.replaceVertex(graphName, collection, vertexKey, vertex, 
            waitForSync, returnNew, returnOld, keepNull);
    }

    @PatchMapping("/{graphName}/vertex/{collection}/{vertexKey}")
    public Mono<Map> updateVertex(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String vertexKey,
            @RequestBody Object vertex,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean keepNull) {
        return graphService.updateVertex(graphName, collection, vertexKey, vertex, 
            waitForSync, returnNew, returnOld, keepNull);
    }

    @DeleteMapping("/{graphName}/vertex/{collection}/{vertexKey}")
    public Mono<Map> deleteVertex(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String vertexKey,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnOld) {
        return graphService.deleteVertex(graphName, collection, vertexKey, waitForSync, returnOld);
    }

    // ==================== Edge Operations ====================

    @PostMapping("/{graphName}/edge/{collection}/create")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createEdge(
            @PathVariable String graphName,
            @PathVariable String collection,
            @RequestBody Object edge,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew) {
        return graphService.createEdge(graphName, collection, edge, waitForSync, returnNew);
    }

    @GetMapping("/{graphName}/edge/{collection}/{edgeKey}")
    public Mono<Map> getEdge(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String edgeKey,
            @RequestParam(required = false) String rev,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        return graphService.getEdge(graphName, collection, edgeKey, rev, ifMatch, ifNoneMatch);
    }

    @PutMapping("/{graphName}/edge/{collection}/{edgeKey}")
    public Mono<Map> replaceEdge(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String edgeKey,
            @RequestBody Object edge,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean keepNull) {
        return graphService.replaceEdge(graphName, collection, edgeKey, edge, 
            waitForSync, returnNew, returnOld, keepNull);
    }

    @PatchMapping("/{graphName}/edge/{collection}/{edgeKey}")
    public Mono<Map> updateEdge(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String edgeKey,
            @RequestBody Object edge,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean keepNull) {
        return graphService.updateEdge(graphName, collection, edgeKey, edge, 
            waitForSync, returnNew, returnOld, keepNull);
    }

    @DeleteMapping("/{graphName}/edge/{collection}/{edgeKey}")
    public Mono<Map> deleteEdge(
            @PathVariable String graphName,
            @PathVariable String collection,
            @PathVariable String edgeKey,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnOld) {
        return graphService.deleteEdge(graphName, collection, edgeKey, waitForSync, returnOld);
    }

    // ==================== Edge Query ====================

    @GetMapping("/edges/{collection}")
    public Mono<Map> getEdges(
            @PathVariable String collection,
            @RequestParam String vertex,
            @RequestParam(required = false) String direction) {
        return graphService.getEdges(collection, vertex, direction);
    }
}
