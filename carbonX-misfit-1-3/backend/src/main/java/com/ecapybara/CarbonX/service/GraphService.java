package com.ecapybara.CarbonX.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ecapybara.CarbonX.exception.ExternalServiceException;
import com.ecapybara.CarbonX.exception.ValidationException;
import com.ecapybara.CarbonX.model.Graph;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class GraphService {

  @Autowired
  private WebClient webClient;

  public Mono<Map> createGraph(Graph graph) {
    try {
      if (graph == null || graph.getName() == null || graph.getName().isEmpty()) {
        throw new ValidationException("Graph name is required");
      }
      
      log.info("Creating graph in ArangoDB: {}", graph.getName());
      
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
              .onStatus(
                  status -> status.is4xxClientError() || status.is5xxServerError(),
                  response -> {
                    log.error("ArangoDB API error creating graph - status: {}", response.statusCode());
                    return response.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new ExternalServiceException(
                            "ArangoDB", response.statusCode().value(), body)));
                  })
              .bodyToMono(Map.class)
              .doOnSuccess(result -> log.info("Successfully created graph: {}", graph.getName()))
              .doOnError(error -> {
                if (error instanceof WebClientResponseException) {
                  WebClientResponseException wcre = (WebClientResponseException) error;
                  log.error("WebClient error creating graph - status: {}, body: {}", 
                      wcre.getStatusCode(), wcre.getResponseBodyAsString(), error);
                } else {
                  log.error("Error creating graph {}: {}", graph.getName(), error.getMessage(), error);
                }
              });
    } catch (ValidationException e) {
      log.error("Graph validation failed: {}", e.getMessage());
      return Mono.error(e);
    } catch (Exception e) {
      log.error("Unexpected error creating graph: {}", e.getMessage(), e);
      return Mono.error(new ExternalServiceException("ArangoDB", "Failed to create graph", e));
    }
  }

  public Mono<Boolean> deleteDocuments(String collection, String key) {
    log.info("Deleting document from ArangoDB graph - collection: {}, key: {}", collection, key);
    
    return webClient.delete()
            .uri("/gharial/{graph}/vertex/{vertexCollection}/{key}", "default", collection, key)
            .retrieve()
            .onStatus(
                status -> status.is4xxClientError() || status.is5xxServerError(),
                response -> {
                  log.error("ArangoDB API error deleting document - status: {}", response.statusCode());
                  return response.bodyToMono(String.class)
                      .flatMap(body -> Mono.error(new ExternalServiceException(
                          "ArangoDB", response.statusCode().value(), body)));
                })
            .bodyToMono(Map.class)
            .map(response -> {
              Object removed = response.get("removed");
              if (removed instanceof Boolean) {
                return (Boolean) removed;
              } else {
                log.warn("Unexpected response format for 'removed' field: {}", removed);
                return false;
              }
            })
            .doOnSuccess(removed -> log.info("Successfully deleted vertex - collection: {}, key: {}, removed: {}", 
                collection, key, removed))
            .doOnError(error -> {
              if (error instanceof WebClientResponseException) {
                WebClientResponseException wcre = (WebClientResponseException) error;
                log.error("WebClient error deleting document - status: {}, body: {}", 
                    wcre.getStatusCode(), wcre.getResponseBodyAsString(), error);
              } else {
                log.error("Error deleting document from collection {} with key {}: {}", 
                    collection, key, error.getMessage(), error);
              }
            });
  }

}
