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
     * GET /_db/{database-name}/_api/gharial
     */
    public Mono<Map> listGraphs(String database) {
        log.info("Listing all graphs");
        return webClient.get()
                        .uri("/_db/" + database +"/_api/gharial")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully listed graphs"));
    }

    /**
     * Create a graph
     * POST /_db/{database-name}/_api/gharial
     */
    public Mono<Map> createGraph( String database, String graphName, List<Map<String, Object>> edgeDefinitions,
                                  List<String> orphanCollections, Boolean isSmart,
                                  Boolean isDisjoint, Map<String, Object> options) {
        log.info("Creating graph: {}", graphName);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", graphName);
        body.put("edgeDefinitions", edgeDefinitions);
        
        if (orphanCollections != null) body.put("orphanCollections", orphanCollections);
        if (isSmart != null) body.put("isSmart", isSmart);
        if (isDisjoint != null) body.put("isDisjoint", isDisjoint);
        if (options != null) body.put("options", options);

        return webClient.post()
                        .uri("/_db/" + database + "/_api/gharial")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully created graph: {}", graphName));
    }

    /**
     * Get a graph
     * GET /_db/{database-name}/_api/gharial/{graph}
     */
    public Mono<Map> getGraph(String database, String graphName) {
        log.info("Getting graph: {}", graphName);
        return webClient.get()
                        .uri("/_db/" + database + "/_api/gharial/" + graphName)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved graph: {}", graphName));
    }

    /**
     * Drop a graph
     * DELETE /_db/{database-name}/_api/gharial/{graph}
     */
    public Mono<Map> dropGraph(String database, String graphName, Boolean dropCollections) {
        log.info("Dropping graph: {}, dropCollections: {}", graphName, dropCollections);

        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName);
        String separator = "?";

        if (dropCollections != null) {
            uri.append(separator).append("dropCollections=").append(dropCollections);
        }
        
        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully dropped graph: {}", graphName));
    }

    // ==================== Edge Collections ====================

    /**
     * List edge collections of a graph
     * GET /_db/{database-name}/_api/gharial/{graph}/edge
     */
    public Mono<Map> listEdgeCollections(String database, String graphName) {
        log.info("Listing edge collections for graph: {}", graphName);
        return webClient.get()
                        .uri("/_db/" + database + "/_api/gharial/" + graphName + "/edge")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully listed edge collections for graph: {}", graphName));
    }

    /**
     * Add an edge definition to a graph
     * POST /_db/{database-name}/_api/gharial/{graph}/edge
     */
    public Mono<Map> addEdgeDefinition( String database, String graphName, String collection,
                                        List<String> from, List<String> to) {
        log.info("Adding edge definition to graph: {}, collection: {}", graphName, collection);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);
        body.put("from", from);
        body.put("to", to);

        return webClient.post()
                        .uri("/_db/" + database + "/_api/gharial/" + graphName + "/edge")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class) 
                        .doOnSuccess(result -> log.info("Successfully added edge definition to graph: {}", graphName));
    }

    /**
     * Replace an edge definition
     * PUT /_db/{database-name}/_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> replaceEdgeDefinition( String database, String graphName, String collection,
                                            List<String> from, List<String> to,
                                            Boolean waitForSync, Boolean dropCollections) {
        log.info("Replacing edge definition in graph: {}, collection: {}", graphName, collection);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);
        body.put("from", from);
        body.put("to", to);

        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";

        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (dropCollections != null) {
            uri.append(separator).append("dropCollections=").append(dropCollections);
        }

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully replaced edge definition in graph: {}", graphName));
    }

    /**
     * Remove an edge definition
     * DELETE /_db/{database-name}/_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> removeEdgeDefinition( String database, String graphName, String collection,
                                           Boolean waitForSync, Boolean dropCollections) {
        log.info("Removing edge definition from graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (dropCollections != null) {
            uri.append(separator).append("dropCollections=").append(dropCollections);
        }

        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully removed edge definition from graph: {}", graphName));
    }

    // ==================== Vertex Collections ====================

    /**
     * List vertex collections of a graph
     * GET /_db/{database-name}/_api/gharial/{graph}/vertex
     */
    public Mono<Map> listVertexCollections(String database, String graphName) {
        log.info("Listing vertex collections for graph: {}", graphName);
        return webClient.get()
                        .uri("/_db/" + database + "/_api/gharial/" + graphName + "/vertex")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully listed vertex collections for graph: {}", graphName));
    }

    /**
     * Add a vertex collection to a graph
     * POST /_db/{database-name}/_api/gharial/{graph}/vertex
     */
    public Mono<Map> addVertexCollection(String database, String graphName, String collection) {
        log.info("Adding vertex collection '{}' to graph: {}", collection, graphName);
        
        Map<String, Object> body = new HashMap<>();
        body.put("collection", collection);

        return webClient.post()
                        .uri("/_db/" + database + "/_api/gharial/" + graphName + "/vertex")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully added vertex collection to graph: {}", graphName));
    }

    /**
     * Remove a vertex collection from a graph
     * DELETE /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}
     */
    public Mono<Map> removeVertexCollection(String database, String graphName, String collection,
                                            Boolean dropCollection) {
        log.info("Removing vertex collection from graph: {}, collection: {}", graphName, collection);

        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection);
        String separator = "?";

        if (dropCollection != null) {
            uri.append(separator).append("dropCollection=").append(dropCollection);
            separator = "&";
        }

        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully removed vertex collection from graph: {}", graphName));
    }

    // ==================== Vertex Operations ====================

    /**
     * Create a vertex
     * POST /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}
     */
    public Mono<Map> createVertex( String database, String graphName, String collection, Object vertex,
                                   Boolean waitForSync, Boolean returnNew) {
        log.info("Creating vertex in graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
        }

        return webClient.post()
                        .uri(uri.toString())
                        .bodyValue(vertex)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully created vertex in graph: {}", graphName));
    }

    /**
     * Get a vertex
     * GET /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> getVertex( String database, String graphName, String collection, String vertexKey,
                                String rev, String ifMatch, String ifNoneMatch) {
        log.info("Getting vertex from graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        if (rev != null) {
            uri.append("?rev=").append(rev);
        }

        return webClient.get()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved vertex from graph: {}", graphName));
    }

    /**
     * Replace a vertex
     * PUT /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> replaceVertex( String database, String graphName, String collection, String vertexKey,
                                    Object vertex, Boolean waitForSync, Boolean returnNew,
                                    Boolean returnOld, Boolean keepNull) {
        log.info("Replacing vertex in graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
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

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(vertex)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully replaced vertex in graph: {}", graphName));
    }

    /**
     * Update a vertex
     * PATCH /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> updateVertex(String database, String graphName, String collection, String vertexKey,
                                   Object vertex, Boolean waitForSync, Boolean returnNew,
                                   Boolean returnOld, Boolean keepNull) {
        log.info("Updating vertex in graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
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

        return webClient.patch()
                        .uri(uri.toString())
                        .bodyValue(vertex)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully updated vertex in graph: {}", graphName));
    }

    /**
     * Delete a vertex
     * DELETE /_db/{database-name}/_api/gharial/{graph}/vertex/{collection}/{vertex}
     */
    public Mono<Map> deleteVertex(String database, String graphName, String collection, String vertexKey,
                                   Boolean waitForSync, Boolean returnOld) {
        log.info("Deleting vertex from graph: {}, collection: {}, key: {}", graphName, collection, vertexKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/vertex/" + collection + "/" + vertexKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
        }

        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully deleted vertex from graph: {}", graphName));
    }

    // ==================== Edge Operations ====================

    /**
     * Create an edge
     * POST /_db/{database-name}/_api/gharial/{graph}/edge/{collection}
     */
    public Mono<Map> createEdge(String database, String graphName, String collection, Object edge,
                                 Boolean waitForSync, Boolean returnNew) {
        log.info("Creating edge in graph: {}, collection: {}", graphName, collection);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnNew != null) {
            uri.append(separator).append("returnNew=").append(returnNew);
        }

        return webClient.post()
                        .uri(uri.toString())
                        .bodyValue(edge)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully created edge in graph: {}", graphName));
    }

    /**
     * Get an edge
     * GET /_db/{database-name}/_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> getEdge(String database, String graphName, String collection, String edgeKey,
                              String rev, String ifMatch, String ifNoneMatch) {
        log.info("Getting edge from graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        if (rev != null) {
            uri.append("?rev=").append(rev);
        }

        return webClient.get()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved edge from graph: {}", graphName));
    }

    /**
     * Replace an edge
     * PUT /_db/{database-name}/_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> replaceEdge(String database, String graphName, String collection, String edgeKey,
                                  Object edge, Boolean waitForSync, Boolean returnNew,
                                  Boolean returnOld, Boolean keepNull) {
        log.info("Replacing edge in graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
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

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(edge)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully replaced edge in graph: {}", graphName));
    }

    /**
     * Update an edge
     * PATCH /_db/{database-name}/_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> updateEdge(String database, String graphName, String collection, String edgeKey,
                                 Object edge, Boolean waitForSync, Boolean returnNew,
                                 Boolean returnOld, Boolean keepNull) {
        log.info("Updating edge in graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
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

        return webClient.patch()
                        .uri(uri.toString())
                        .bodyValue(edge)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully updated edge in graph: {}", graphName));
    }

    /**
     * Delete an edge
     * DELETE /_db/{database-name}/_api/gharial/{graph}/edge/{collection}/{edge}
     */
    public Mono<Map> deleteEdge(String database, String graphName, String collection, String edgeKey,
                                 Boolean waitForSync, Boolean returnOld) {
        log.info("Deleting edge from graph: {}, collection: {}, key: {}", graphName, collection, edgeKey);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + graphName + "/edge/" + collection + "/" + edgeKey);
        String separator = "?";
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
        }

        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully deleted edge from graph: {}", graphName));
    }

    // ==================== Edge Query ====================

    /**
     * Get inbound and outbound edges
     * GET /_db/{database-name}/_api/edges/{collection}
     */
    public Mono<Map> getEdges(String database, String collection, String vertex, String direction) {
        log.info("Getting edges for vertex: {} in collection: {}, direction: {}", vertex, collection, direction);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/gharial/" + "?vertex=" + vertex);
        if (direction != null) {
            uri.append("&direction=").append(direction); // "in", "out", or "any"
        }

        return webClient.get()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved edges for vertex: {}", vertex));
    }
}
