package com.ecapybara.carbonx.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.ResponseSpec;

import reactor.core.publisher.Mono;

@Service
public class DocumentService {

  @Autowired
  private WebClient webClient;

  public ResponseSpec getDocument(String collection, String key) {
    return webClient.get()
            .uri("/document/{collection}/{key}", collection, key)
            .retrieve();
  }

  //--- Unfinished ---
  public Mono<String> createDocuments(Map<?,?> request) {
    return webClient.post()
            .uri("/document/{collection}") // uncompleted "collection" variable assignment
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class);
  }
}
