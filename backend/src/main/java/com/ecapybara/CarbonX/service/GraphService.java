package com.ecapybara.carbonx.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.ecapybara.carbonx.config.AppLogger;
import com.ecapybara.carbonx.model.basic.Graph;

import reactor.core.publisher.Mono;

@Service
public class GraphService {

  @Autowired
  private WebClient webClient;
  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);

  public Mono<Map> createGraph(Graph graph) {    
    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("name", graph.getName()); // Required
    requestBody.put("edgeDefinitions", graph.getEdgeDefinitions());  // Required
    /*
    requestBody.put("orphanCollections", orphanCollections);
    */

    return webClient.post()
            .uri("/gharial")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map.class);
  }

  public Mono<Boolean> deleteDocuments(String collection, String key) {
    return webClient.delete()
            .uri("/gharial/{graph}/vertex/{vertexCollection}/{key}", "default", collection, key)
            .retrieve()
            .bodyToMono(Map.class)
            .map(response -> (Boolean) response.get("removed"))
            .doOnSuccess(removed -> log.info("Vertex deleted: {}", removed));
  }

  public String getGraphMetadata(String name) {    
    return webClient
            .get()
            .uri("/gharial/{name}",name)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    public String getEdgeCollections(String name) {    
    return webClient
        .get()
        .uri("/gharial/{name}/edge",name)
        .retrieve()
        .bodyToMono(String.class)
        .block();
    }
    public String getNodeCollections(String name) {    
    return webClient
        .get()
        .uri("/gharial/{name}/vertex",name)
        .retrieve()
        .bodyToMono(String.class)
        .block();
    }

    //  send AQL query (Hardcoded version)
    // public Map<String, Object> getGraph() {

    //     String query = "LET nodes = (FOR v IN products RETURN { id: v._id, label: v.name, type: 'products' }) "
    //             + "LET processNodes = (FOR v IN processes RETURN { id: v._id, label: v.name, type: 'process' }) "
    //             + "LET inputLinks = (FOR e IN inputs RETURN { source: e._from, target: e._to, type: 'input' }) "
    //             + "LET outputLinks = (FOR e IN outputs RETURN { source: e._from, target: e._to, type: 'output' }) "
    //             + "RETURN { nodes: UNION(nodes, processNodes), links: UNION(inputLinks, outputLinks) }";
    //     Map<String, String> body = Map.of("query", query);

    //     Map response = webClient
    //             .post()
    //             .uri("/cursor")
    //             .bodyValue(body)
    //             .retrieve()
    //             .bodyToMono(Map.class) // raw Map
    //             .block();

    //     // Extract "result" array
    //     List<Map<String, Object>> result = (List<Map<String, Object>>) response.get("result");

    //     // Return the first object or null if empty
    //     return result.isEmpty() ? null : result.get(0);
    // }


    public Map<String, Object> executeQuery(String database, String query) {

    Map<String, String> body = Map.of("query", query);
    String fullUrl = "http://localhost:8529/_db/" + database + "/_api/cursor"; //Find some way to use webclient

    Map response = webClient
            .post()
            .uri(fullUrl)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(Map.class)
            .block();

    return response;
    }



}
