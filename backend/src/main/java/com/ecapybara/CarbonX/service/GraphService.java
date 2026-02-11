package com.ecapybara.carbonx.service;

import java.util.HashMap;
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

}
