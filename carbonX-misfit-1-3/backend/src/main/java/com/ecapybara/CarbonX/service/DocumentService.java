package com.ecapybara.CarbonX.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.ResponseSpec;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.ecapybara.CarbonX.exception.ExternalServiceException;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class DocumentService {

  @Autowired
  private WebClient webClient;

  public ResponseSpec getDocuments(String collection, String key) {
    try {
      log.info("Fetching document from ArangoDB - collection: {}, key: {}", collection, key);
      return webClient.get()
              .uri("/document/{collection}/{key}", collection, key)
              .retrieve()
              .onStatus(
                  status -> status.is4xxClientError() || status.is5xxServerError(),
                  response -> {
                    log.error("ArangoDB API error - status: {}", response.statusCode());
                    return response.bodyToMono(String.class)
                        .flatMap(body -> Mono.error(new ExternalServiceException(
                            "ArangoDB", response.statusCode().value(), body)));
                  });
    } catch (Exception e) {
      log.error("Error creating request to ArangoDB: {}", e.getMessage(), e);
      throw new ExternalServiceException("ArangoDB", "Failed to create document request", e);
    }
  }

  //--- Unfinished ---
  public Mono<String> createDocuments(Map<?,?> request) {
    log.info("Creating document in ArangoDB: {}", request);
    return webClient.post()
            .uri("/document/{collection}")
            .bodyValue(request)
            .retrieve()
            .onStatus(
                status -> status.is4xxClientError() || status.is5xxServerError(),
                response -> {
                  log.error("ArangoDB API error - status: {}", response.statusCode());
                  return response.bodyToMono(String.class)
                      .flatMap(body -> Mono.error(new ExternalServiceException(
                          "ArangoDB", response.statusCode().value(), body)));
                })
            .bodyToMono(String.class)
            .doOnSuccess(result -> log.info("Successfully created document: {}", result))
            .doOnError(error -> {
              if (error instanceof WebClientResponseException) {
                WebClientResponseException wcre = (WebClientResponseException) error;
                log.error("WebClient error creating document - status: {}, body: {}", 
                    wcre.getStatusCode(), wcre.getResponseBodyAsString(), error);
              } else {
                log.error("Error creating document: {}", error.getMessage(), error);
              }
            });
  }
}
