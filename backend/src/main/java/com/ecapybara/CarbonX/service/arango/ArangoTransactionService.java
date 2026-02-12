package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Transaction operations.
 * Provides methods for executing JavaScript transactions and managing Stream Transactions.
 */
@Slf4j
@Service
public class ArangoTransactionService extends BaseArangoService {

    // ==================== Stream Transactions ====================

    /**
     * List running Stream Transactions
     * GET /_api/transaction
     */
    public Mono<Map> listTransactions() {
        log.info("Listing running stream transactions");
        return get("/transaction", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed stream transactions"));
    }

    /**
     * Begin a Stream Transaction
     * POST /_api/transaction/begin
     */
    public Mono<Map> beginTransaction(List<String> readCollections,
                                       List<String> writeCollections,
                                       List<String> exclusiveCollections,
                                       Boolean waitForSync, Boolean allowImplicit,
                                       Integer lockTimeout, Long maxTransactionSize) {
        log.info("Beginning stream transaction");
        
        Map<String, Object> collections = new HashMap<>();
        if (readCollections != null) collections.put("read", readCollections);
        if (writeCollections != null) collections.put("write", writeCollections);
        if (exclusiveCollections != null) collections.put("exclusive", exclusiveCollections);

        Map<String, Object> body = new HashMap<>();
        body.put("collections", collections);
        
        if (waitForSync != null) body.put("waitForSync", waitForSync);
        if (allowImplicit != null) body.put("allowImplicit", allowImplicit);
        if (lockTimeout != null) body.put("lockTimeout", lockTimeout);
        if (maxTransactionSize != null) body.put("maxTransactionSize", maxTransactionSize);

        return post("/transaction/begin", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully began stream transaction"));
    }

    /**
     * Get the status of a Stream Transaction
     * GET /_api/transaction/{transaction-id}
     */
    public Mono<Map> getTransactionStatus(String transactionId) {
        log.info("Getting transaction status: {}", transactionId);
        return get("/transaction/{id}", Map.class, transactionId)
                .doOnSuccess(result -> log.info("Successfully retrieved transaction status: {}", transactionId));
    }

    /**
     * Commit a Stream Transaction
     * PUT /_api/transaction/{transaction-id}
     */
    public Mono<Map> commitTransaction(String transactionId) {
        log.info("Committing transaction: {}", transactionId);
        return put("/transaction/{id}", new HashMap<>(), Map.class, transactionId)
                .doOnSuccess(result -> log.info("Successfully committed transaction: {}", transactionId));
    }

    /**
     * Abort a Stream Transaction
     * DELETE /_api/transaction/{transaction-id}
     */
    public Mono<Map> abortTransaction(String transactionId) {
        log.info("Aborting transaction: {}", transactionId);
        return delete("/transaction/{id}", Map.class, transactionId)
                .doOnSuccess(result -> log.info("Successfully aborted transaction: {}", transactionId));
    }

    // ==================== JavaScript Transactions ====================

    /**
     * Execute a JavaScript Transaction
     * POST /_api/transaction
     */
    public Mono<Map> executeJsTransaction(String action,
                                           List<String> readCollections,
                                           List<String> writeCollections,
                                           List<String> exclusiveCollections,
                                           Map<String, Object> params,
                                           Boolean waitForSync, Boolean allowImplicit,
                                           Integer lockTimeout, Long maxTransactionSize) {
        log.info("Executing JavaScript transaction");
        
        Map<String, Object> collections = new HashMap<>();
        if (readCollections != null) collections.put("read", readCollections);
        if (writeCollections != null) collections.put("write", writeCollections);
        if (exclusiveCollections != null) collections.put("exclusive", exclusiveCollections);

        Map<String, Object> body = new HashMap<>();
        body.put("action", action);
        body.put("collections", collections);
        
        if (params != null) body.put("params", params);
        if (waitForSync != null) body.put("waitForSync", waitForSync);
        if (allowImplicit != null) body.put("allowImplicit", allowImplicit);
        if (lockTimeout != null) body.put("lockTimeout", lockTimeout);
        if (maxTransactionSize != null) body.put("maxTransactionSize", maxTransactionSize);

        return post("/transaction", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully executed JavaScript transaction"));
    }

    // ==================== Helper Methods for Transaction Context ====================

    /**
     * Execute a document operation within a transaction context
     */
    public Mono<Map> executeInTransaction(String transactionId, String collection, 
                                           String operation, Object document) {
        log.info("Executing {} in transaction {} on collection {}", operation, transactionId, collection);
        
        String uri;
        switch (operation.toUpperCase()) {
            case "CREATE":
                uri = "/document/" + collection;
                return webClient.post()
                        .uri(uri)
                        .header("x-arango-trx-id", transactionId)
                        .bodyValue(document)
                        .retrieve()
                        .bodyToMono(Map.class);
            case "UPDATE":
            case "REPLACE":
                uri = "/document/" + collection;
                return webClient.put()
                        .uri(uri)
                        .header("x-arango-trx-id", transactionId)
                        .bodyValue(document)
                        .retrieve()
                        .bodyToMono(Map.class);
            case "DELETE":
                uri = "/document/" + collection;
                return webClient.method(org.springframework.http.HttpMethod.DELETE)
                        .uri(uri)
                        .header("x-arango-trx-id", transactionId)
                        .bodyValue(document)
                        .retrieve()
                        .bodyToMono(Map.class);
            default:
                return Mono.error(new IllegalArgumentException("Unknown operation: " + operation));
        }
    }

    /**
     * Execute an AQL query within a transaction context
     */
    public Mono<Map> queryInTransaction(String transactionId, String query,
                                         Map<String, Object> bindVars) {
        log.info("Executing query in transaction: {}", transactionId);
        
        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        if (bindVars != null) body.put("bindVars", bindVars);

        return webClient.post()
                .uri("/cursor")
                .header("x-arango-trx-id", transactionId)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully executed query in transaction: {}", transactionId));
    }
}
