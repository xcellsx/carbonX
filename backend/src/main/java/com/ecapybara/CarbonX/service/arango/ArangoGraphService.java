package com.ecapybara.carbonx.service.arango;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Graph (Gharial) operations.
 * Provides methods for managing named graphs, vertices, and edges.
 */
@Slf4j
@Service
public class ArangoGraphService extends BaseArangoService {

    // ==================== Graph CRUD ====================

    /**
     * List all graphs
     * GET /_api/gharial
     */
    public Mono<Map> listGraphs() {
        log.info("Listing all graphs");
        return get("/gharial", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed graphs"));
    }

    /**
     * Create a graph
     * POST /_api/gharial
     */
    public Mono<Map> createGraph(String name, List<Map<String, Object>> edgeDefinitions,
                                  List<String> orphanCollections, Boolean isSmart,
                                  Boolean isDisjoint, Map<String, Object> options) {
        log.info("Creating graph: {}", name);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("edgeDefinitions", edgeDefinitions);
        
        if (orphanCollections != null) body.put("orphanCollections", orphanCollections);
        if (isSmart != null) body.put("isSmart", isSmart);
        if (isDisjoint != null) body.put("isDisjoint", isDisjoint);
        if (options != null) body.put("options", options);

        return post("/gharial", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created graph: {}", name));
    }

    /**
     * Get a graph
     * GET /_api/gharial/{graph}
     */
    public Mono<Map> getGraph(String graphName) {
        log.info("Getting graph: {}", graphName);
        return get("/gharial/{graph}", Map.class, graphName)
                .doOnSuccess(result -> log.info("Successfully retrieved graph: {}", graphName));
    }

    /**
     * Drop a graph
     * DELETE /_api/gharial/{graph}
     */
    public Mono<Map> dropGraph(String graphName, Boolean dropCollections) {
        log.info("Dropping graph: {}, dropCollections: {}", graphName, dropCollections);
        String uri = dropCollections != null && dropCollections 
            ? "/gharial/" + graphName + "?dropCollections=true"
            : "/gharial/" + graphName;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully dropped graph: {}", graphName));
    }

    // ==================== Edge Collections ====================

    /**
     * List edge collections of a graph
     * GET /_api/gharial/{graph}/edge
     */
    public Mono<Map> listEdgeCollections(String graphName) {
        log.info("Listing edge collections for graph: {}", graphName);
        return get("/gharial/{graph}/edge", Map.class, graphName)
                .doOnSuccess(result -> log.info("Successfully listed edge collections for graph: {}", graphName));
    }

    /**
     * Add an edge definition to a graph
     * POST /_api/gharial/{graph}/edge
     */
    public Mono<Map> addEdgeDefinition(String graphName, String collection,
                                        List<String> from, List<String> to) {
        log.info("Adding edge definition to graph: {}, collection: {}", graphName, collection);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);
        body.put("from", from);
        body.put("to", to);

        return post("/gharial/{graph}/edge", body, Map.class, graphName)
                .doOnSuccess(result -> log.info("Successfully added edge definition to graph: {}", graphName));
    }

    /**
     * Replace an edge definition
     * PUT /_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> replaceEdgeDefinition(String graphName, String collection,
                                            List<String> from, List<String> to,
                                            Boolean waitForSync, Boolean dropCollections) {
        log.info("Replacing edge definition in graph: {}, collection: {}", graphName, collection);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);
        body.put("from", from);
        body.put("to", to);

        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (dropCollections != null) {
            uri.append(separator).append("dropCollections=").append(dropCollections);
        }

        return put(uri.toString(), body, Map.class)
                .doOnSuccess(result -> log.info("Successfully replaced edge definition in graph: {}", graphName));
    }

    /**
     * Remove an edge definition
     * DELETE /_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> removeEdgeDefinition(String graphName, String collection,
                                           Boolean waitForSync, Boolean dropCollections) {
        log.info("Removing edge definition from graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (dropCollections != null) {
            uri.append(separator).append("dropCollections=").append(dropCollections);
        }

        return delete(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully removed edge definition from graph: {}", graphName));
    }

    // ==================== Vertex Collections ====================

    /**
     * List vertex collections of a graph
     * GET /_api/gharial/{graph}/vertex
     */
    public Mono<Map> listVertexCollections(String graphName, Boolean excludeOrphans) {
        log.info("Listing vertex collections for graph: {}", graphName);
        String uri = excludeOrphans != null && excludeOrphans 
            ? "/gharial/" + graphName + "/vertex?excludeOrphans=true"
            : "/gharial/" + graphName + "/vertex";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully listed vertex collections for graph: {}", graphName));
    }

    /**
     * Add a vertex collection to a graph
     * POST /_api/gharial/{graph}/vertex
     */
    public Mono<Map> addVertexCollection(String graphName, String collection) {
        log.info("Adding vertex collection to graph: {}, collection: {}", graphName, collection);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);

        return post("/gharial/{graph}/vertex", body, Map.class, graphName)
                .doOnSuccess(result -> log.info("Successfully added vertex collection to graph: {}", graphName));
    }

    /**
     * Remove a vertex collection from a graph
     * DELETE /_api/gharial/{graph}/vertex/{collection}
     */
    public Mono<Map> removeVertexCollection(String graphName, String collection,
                                             Boolean dropCollection) {
        log.info("Removing vertex collection from graph: {}, collection: {}", graphName, collection);
        String uri = dropCollection != null && dropCollection 
            ? "/gharial/" + graphName + "/vertex/" + collection + "?dropCollection=true"
            : "/gharial/" + graphName + "/vertex/" + collection;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully removed vertex collection from graph: {}", graphName));
    }

    // ==================== Vertex Operations ====================

    /**
     * Create a vertex
     * POST /_api/gharial/{graph}/vertex/{collection}
     */
    public Mono<Map> createVertex(String graphName, String collection, Object vertex,
                                   Boolean waitForSync, Boolean returnNew) {
        log.info("Creating vertex in graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/vertex/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
        }

        return post(uri.toString(), vertex, Map.class)
                .doOnSuccess(result -> log.info("Successfully created vertex in graph: {}", graphName));
    }

    /**
     * Get a vertex
     * GET /_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> getVertex(String graphName, String collection, String vertexKey,
                                String rev, String ifMatch, String ifNoneMatch) {
        log.info("Getting vertex from graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        if (rev != null) {
            uri.append("?rev=").append(rev);
        }

        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved vertex from graph: {}", graphName));
    }

    /**
     * Replace a vertex
     * PUT /_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> replaceVertex(String graphName, String collection, String vertexKey,
                                    Object vertex, Boolean waitForSync, Boolean returnNew,
                                    Boolean returnOld, Boolean keepNull) {
        log.info("Replacing vertex in graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (keepNull != null) {
            uri.append(separator).append("keepNull=").append(keepNull);
        }

        return put(uri.toString(), vertex, Map.class)
                .doOnSuccess(result -> log.info("Successfully replaced vertex in graph: {}", graphName));
    }

    /**
     * Update a vertex
     * PATCH /_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> updateVertex(String graphName, String collection, String vertexKey,
                                   Object vertex, Boolean waitForSync, Boolean returnNew,
                                   Boolean returnOld, Boolean keepNull) {
        log.info("Updating vertex in graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (keepNull != null) {
            uri.append(separator).append("keepNull=").append(keepNull);
        }

        return patch(uri.toString(), vertex, Map.class)
                .doOnSuccess(result -> log.info("Successfully updated vertex in graph: {}", graphName));
    }

    /**
     * Delete a vertex
     * DELETE /_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> deleteVertex(String graphName, String collection, String vertexKey,
                                   Boolean waitForSync, Boolean returnOld) {
        log.info("Deleting vertex from graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
        }

        return delete(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully deleted vertex from graph: {}", graphName));
    }

    // ==================== Edge Operations ====================

    /**
     * Create an edge
     * POST /_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> createEdge(String graphName, String collection, Object edge,
                                 Boolean waitForSync, Boolean returnNew) {
        log.info("Creating edge in graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
        }

        return post(uri.toString(), edge, Map.class)
                .doOnSuccess(result -> log.info("Successfully created edge in graph: {}", graphName));
    }

    /**
     * Get an edge
     * GET /_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> getEdge(String graphName, String collection, String edgeKey,
                              String rev, String ifMatch, String ifNoneMatch) {
        log.info("Getting edge from graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        if (rev != null) {
            uri.append("?rev=").append(rev);
        }

        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved edge from graph: {}", graphName));
    }

    /**
     * Replace an edge
     * PUT /_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> replaceEdge(String graphName, String collection, String edgeKey,
                                  Object edge, Boolean waitForSync, Boolean returnNew,
                                  Boolean returnOld, Boolean keepNull) {
        log.info("Replacing edge in graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (keepNull != null) {
            uri.append(separator).append("keepNull=").append(keepNull);
        }

        return put(uri.toString(), edge, Map.class)
                .doOnSuccess(result -> log.info("Successfully replaced edge in graph: {}", graphName));
    }

    /**
     * Update an edge
     * PATCH /_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> updateEdge(String graphName, String collection, String edgeKey,
                                 Object edge, Boolean waitForSync, Boolean returnNew,
                                 Boolean returnOld, Boolean keepNull) {
        log.info("Updating edge in graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (keepNull != null) {
            uri.append(separator).append("keepNull=").append(keepNull);
        }

        return patch(uri.toString(), edge, Map.class)
                .doOnSuccess(result -> log.info("Successfully updated edge in graph: {}", graphName));
    }

    /**
     * Delete an edge
     * DELETE /_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> deleteEdge(String graphName, String collection, String edgeKey,
                                 Boolean waitForSync, Boolean returnOld) {
        log.info("Deleting edge from graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
        }

        return delete(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully deleted edge from graph: {}", graphName));
    }

    // ==================== Edge Query ====================

    /**
     * Get inbound and outbound edges
     * GET /_api/edges/{collection-id}
     */
    public Mono<Map> getEdges(String collection, String vertex, String direction) {
        log.info("Getting edges for vertex: {} in collection: {}, direction: {}", vertex, collection, direction);
        
        StringBuilder uri = new StringBuilder("/edges/" + collection + "?vertex=" + vertex);
        if (direction != null) {
            uri.append("&direction=").append(direction); // "in", "out", or "any"
        }

        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved edges for vertex: {}", vertex));
    }
}
