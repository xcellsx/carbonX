package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Document operations.
 * Provides methods for CRUD operations on documents.
 */
@Slf4j
@Service
public class ArangoDocumentService extends BaseArangoService {
    private static final String ARANGODB = "default";

    // ==================== Single Document Operations ====================

    /**
     * Create a document
     * POST /_db/{database-name}/_api/document/{collection}
     */
    public Mono<Map> createDocument( String database, String collection, Object document, 
                                     Boolean waitForSync, Boolean returnNew,
                                     Boolean returnOld, Boolean silent,
                                     String overwriteMode) {
        log.info("Creating document in collection: {}", collection);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/document/" + collection);
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
        if (silent != null) {
            uri.append(separator).append("silent=").append(silent);
            separator = "&";
        }
        if (overwriteMode != null) {
            uri.append(separator).append("overwriteMode=").append(overwriteMode);
        }

        return webClient.post()
                        .uri(uri.toString())
                        .bodyValue(document.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully created document in collection: {}", collection));
    }

    /**
     * Get a document
     * GET /_db/{database-name}/_api/document/{collection}/{key}
     */
    public Mono<Map> getDocument(String database, String collection, String key, 
                                 String ifNoneMatch, String ifMatch) {
        log.info("Getting document from collection: {}, key: {}", collection, key);
        
        return webClient.get()
                        .uri("/_db/" + database + "/_api/document/" + collection + "/" + key)
                        .headers(headers -> {
                            if (ifNoneMatch != null) headers.set("If-None-Match", ifNoneMatch);
                            if (ifMatch != null) headers.set("If-Match", ifMatch);
                        })
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved {}/{} -> {}", collection, key, result));
    }

    /**
     * Check if document exists (HEAD request)
     * HEAD /_db/{database-name}/_api/document/{collection}/{key}
     */
    public Mono<Boolean> documentExists( String database, String collection, String key, 
                                         String ifNoneMatch, String ifMatch) {
        log.info("Checking document existence: {}/{}", collection, key);
        
        return webClient.head()
                        .uri("/document/{collection}/{key}", collection, key)
                        .headers(headers -> {
                            if (ifNoneMatch != null) headers.set("If-None-Match", ifNoneMatch);
                            if (ifMatch != null) headers.set("If-Match", ifMatch);
                        })
                        .exchangeToMono(response -> Mono.just(response.statusCode().is2xxSuccessful()))
                        .doOnSuccess(exists -> log.info("Document {}/{} exists: {}", collection, key, exists));
    }

    /**
     * Replace a document
     * PUT /_db/{database-name}/_api/document/{collection}/{key}
     */
    public Mono<Map> replaceDocument( String database, String collection, String key, Object document,
                                      Boolean waitForSync, Boolean returnNew,
                                      Boolean returnOld, Boolean silent,
                                      String ifMatch, Boolean ignoreRevs) {
        log.info("Replacing document: {}/{}", collection, key);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database + "/_api/document/" + collection + "/" + key);
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
        if (silent != null) {
            uri.append(separator).append("silent=").append(silent);
            separator = "&";
        }
        if (ignoreRevs != null) {
            uri.append(separator).append("ignoreRevs=").append(ignoreRevs);
        }

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(document.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully replaced document: {}/{}", collection, key));
    }

    /**
     * Update (patch) a document
     * PATCH /_db/{database-name}/_api/document/{collection}/{key}
     */
    public Mono<Map> updateDocument( String database, String collection, String key, Object document,
                                     Boolean waitForSync, Boolean returnNew,
                                     Boolean returnOld, Boolean silent,
                                     Boolean keepNull, Boolean mergeObjects,
                                     String ifMatch, Boolean ignoreRevs) {
        log.info("Updating document: {}/{}", collection, key);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database + "/_api/document/" + collection + "/" + key);
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
        if (silent != null) {
            uri.append(separator).append("silent=").append(silent);
            separator = "&";
        }
        if (keepNull != null) {
            uri.append(separator).append("keepNull=").append(keepNull);
            separator = "&";
        }
        if (mergeObjects != null) {
            uri.append(separator).append("mergeObjects=").append(mergeObjects);
            separator = "&";
        }
        if (ignoreRevs != null) {
            uri.append(separator).append("ignoreRevs=").append(ignoreRevs);
        }

        return webClient.patch()
                        .uri(uri.toString())
                        .bodyValue(document.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully updated document: {}/{}", collection, key));
    }

    /**
     * Delete a document
     * DELETE /_db/{database-name}/_api/document/{collection}/{key}
     */
    public Mono<Map> deleteDocument( String database, String collection, String key,
                                     Boolean waitForSync, Boolean returnOld,
                                     Boolean silent, String ifMatch) {
        log.info("Deleting document: {}/{}", collection, key);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database + "/_api/document/" + collection + "/" + key);
        String separator = "?";
        
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (silent != null) {
            uri.append(separator).append("silent=").append(silent);
        }

        return webClient.delete()
                        .uri(uri.toString())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .doOnSuccess(result -> log.info("Successfully deleted document: {}/{}", collection, key));
    }

    // ==================== Multiple Document Operations ====================

    /**
     * Create multiple documents
     * POST /_db/{database-name}/_api/document/{collection}
     */
    public Mono<List> createDocuments( String database, String collection, List<? extends Object> documents,
                                       Boolean waitForSync, Boolean returnNew,
                                       Boolean returnOld, Boolean silent,
                                       String overwriteMode) {
        log.info("Creating {} documents in collection: {}", documents.size(), collection);
        
        StringBuilder uri = new StringBuilder("/_db/" + database + "/_api/document/" + collection);
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
        if (silent != null) {
            uri.append(separator).append("silent=").append(silent);
            separator = "&";
        }
        if (overwriteMode != null) {
            uri.append(separator).append("overwriteMode=").append(overwriteMode);
        }

        return webClient.post()
                        .uri(uri.toString())
                        .bodyValue(documents.toString())
                        .retrieve()
                        .bodyToMono(List.class)
                        .doOnSuccess(result -> log.info("Successfully created {} documents in collection: {}", documents.size(), collection));
    }

    /**
     * Get multiple documents
     * PUT /_api/document/{collection}?onlyget=true
     */
    public Mono<List> getDocuments( String collection, List<String> keys,
                                    Boolean ignoreRevs) {
        log.info("Getting {} documents from collection: {}", keys.size(), collection);
        
        StringBuilder uri = new StringBuilder("/_db/"+ ARANGODB+ "/_api/document/" + collection + "?onlyget=true");
        if (ignoreRevs != null) {
            uri.append("&ignoreRevs=").append(ignoreRevs);
        }

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(keys)
                        .retrieve()
                        .bodyToMono(List.class)
                        .doOnSuccess(result -> log.info("Successfully retrieved {} documents from collection: {}", keys.size(), collection));
    }

    /**
     * Replace multiple documents
     * PUT /_db/{database-name}/_api/document/{collection}
     */
    public Mono<List> replaceDocuments( String database, String collection, List<? extends Object> documents,
                                        Boolean waitForSync, Boolean returnNew,
                                        Boolean returnOld, Boolean ignoreRevs) {
        log.info("Replacing {} documents in collection: {}", documents.size(), collection);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database +"/_api/document/" + collection);
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
        if (ignoreRevs != null) {
            uri.append(separator).append("ignoreRevs=").append(ignoreRevs);
        }

        return webClient.put()
                        .uri(uri.toString())
                        .bodyValue(documents.toString())
                        .retrieve()
                        .bodyToMono(List.class)
                        .doOnSuccess(result -> log.info("Successfully replaced {} documents in collection: {}", documents.size(), collection));
    }

    /**
     * Update multiple documents
     * PATCH /_db/{database-name}/_api/document/{collection}
     */
    public Mono<List> updateDocuments(  String database, String collection, List<? extends Object> documents,
                                        Boolean waitForSync, Boolean returnNew,
                                        Boolean returnOld, Boolean keepNull,
                                        Boolean mergeObjects, Boolean ignoreRevs) {
        log.info("Updating {} documents in collection: {}", documents.size(), collection);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database +"/_api/document/" + collection);
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
            separator = "&";
        }
        if (mergeObjects != null) {
            uri.append(separator).append("mergeObjects=").append(mergeObjects);
            separator = "&";
        }
        if (ignoreRevs != null) {
            uri.append(separator).append("ignoreRevs=").append(ignoreRevs);
        }

        return webClient.patch()
                        .uri(uri.toString())
                        .bodyValue(documents.toString())
                        .retrieve()
                        .bodyToMono(List.class)
                        .doOnSuccess(result -> log.info("Successfully updated {} documents in collection: {}", documents.size(), collection));
    }

    /**
     * Delete multiple documents
     * DELETE /_db/{database-name}/_api/document/{collection}
     */
    public Mono<List> deleteDocuments( String database, String collection, List<Object> selectors,
                                       Boolean waitForSync, Boolean returnOld,
                                       Boolean ignoreRevs) {
        log.info("Deleting {} documents from collection: {}", selectors.size(), collection);
        
        StringBuilder uri = new StringBuilder("/_db/"+ database + "/_api/document/" + collection);
        String separator = "?";
        
        if (waitForSync != null) {
            uri.append(separator).append("waitForSync=").append(waitForSync);
            separator = "&";
        }
        if (returnOld != null) {
            uri.append(separator).append("returnOld=").append(returnOld);
            separator = "&";
        }
        if (ignoreRevs != null) {
            uri.append(separator).append("ignoreRevs=").append(ignoreRevs);
        }

        // DELETE with body uses a different approach
        return webClient.method(org.springframework.http.HttpMethod.DELETE)
                        .uri(uri.toString())
                        .bodyValue(selectors)
                        .retrieve()
                        .bodyToMono(List.class)
                        .doOnSuccess(result -> log.info("Successfully deleted {} documents from collection: {}", selectors.size(), collection));
    }
}
