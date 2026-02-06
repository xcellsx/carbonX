package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoTransactionService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Transaction operations.
 * Base path: /api/arango/transactions
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/transactions")
public class ArangoTransactionController {

    @Autowired
    private ArangoTransactionService transactionService;

    // ==================== Stream Transactions ====================

    @GetMapping
    public Mono<Map> listTransactions() {
        return transactionService.listTransactions();
    }

    @PostMapping("/begin")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> beginTransaction(@RequestBody Map<String, Object> request) {
        Map<String, Object> collections = (Map<String, Object>) request.get("collections");
        List<String> readCollections = collections != null ? 
            (List<String>) collections.get("read") : null;
        List<String> writeCollections = collections != null ? 
            (List<String>) collections.get("write") : null;
        List<String> exclusiveCollections = collections != null ? 
            (List<String>) collections.get("exclusive") : null;
        
        Boolean waitForSync = (Boolean) request.get("waitForSync");
        Boolean allowImplicit = (Boolean) request.get("allowImplicit");
        Integer lockTimeout = (Integer) request.get("lockTimeout");
        Long maxTransactionSize = request.get("maxTransactionSize") != null ? 
            ((Number) request.get("maxTransactionSize")).longValue() : null;
        
        return transactionService.beginTransaction(readCollections, writeCollections, 
            exclusiveCollections, waitForSync, allowImplicit, lockTimeout, maxTransactionSize);
    }

    @GetMapping("/{transactionId}")
    public Mono<Map> getTransactionStatus(@PathVariable String transactionId) {
        return transactionService.getTransactionStatus(transactionId);
    }

    @PutMapping("/{transactionId}/commit")
    public Mono<Map> commitTransaction(@PathVariable String transactionId) {
        return transactionService.commitTransaction(transactionId);
    }

    @DeleteMapping("/{transactionId}")
    public Mono<Map> abortTransaction(@PathVariable String transactionId) {
        return transactionService.abortTransaction(transactionId);
    }

    // ==================== JavaScript Transactions ====================

    @PostMapping("/js")
    public Mono<Map> executeJsTransaction(@RequestBody Map<String, Object> request) {
        String action = (String) request.get("action");
        Map<String, Object> collections = (Map<String, Object>) request.get("collections");
        List<String> readCollections = collections != null ? 
            (List<String>) collections.get("read") : null;
        List<String> writeCollections = collections != null ? 
            (List<String>) collections.get("write") : null;
        List<String> exclusiveCollections = collections != null ? 
            (List<String>) collections.get("exclusive") : null;
        
        Map<String, Object> params = (Map<String, Object>) request.get("params");
        Boolean waitForSync = (Boolean) request.get("waitForSync");
        Boolean allowImplicit = (Boolean) request.get("allowImplicit");
        Integer lockTimeout = (Integer) request.get("lockTimeout");
        Long maxTransactionSize = request.get("maxTransactionSize") != null ? 
            ((Number) request.get("maxTransactionSize")).longValue() : null;
        
        return transactionService.executeJsTransaction(action, readCollections, 
            writeCollections, exclusiveCollections, params, waitForSync, 
            allowImplicit, lockTimeout, maxTransactionSize);
    }

    // ==================== Transaction Context Operations ====================

    @PostMapping("/{transactionId}/document/{collection}")
    public Mono<Map> executeDocumentInTransaction(
            @PathVariable String transactionId,
            @PathVariable String collection,
            @RequestParam String operation,
            @RequestBody Object document) {
        return transactionService.executeInTransaction(transactionId, collection, 
            operation, document);
    }

    @PostMapping("/{transactionId}/query")
    public Mono<Map> queryInTransaction(
            @PathVariable String transactionId,
            @RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Map<String, Object> bindVars = (Map<String, Object>) request.get("bindVars");
        
        return transactionService.queryInTransaction(transactionId, query, bindVars);
    }
}
