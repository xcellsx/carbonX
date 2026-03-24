package com.ecapybara.carbonx.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.service.arango.ArangoDocumentService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class DocumentService extends ArangoDocumentService {

   @Autowired
   private ArangoQueryService queryService;

   public Mono<Map> getAllDocuments(String database, String collection) {
      String query = "FOR doc in @@collection RETURN doc";
      Map<String,String> bindVars = Map.of("@collection", collection);
      return queryService.executeQuery(database, query, bindVars, null, null, null, null);
   }
}
