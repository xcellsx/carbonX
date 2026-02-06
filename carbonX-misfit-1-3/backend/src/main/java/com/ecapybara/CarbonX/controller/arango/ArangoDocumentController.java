package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoDocumentService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Document operations.
 * Base path: /api/arango/documents
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/documents")
public class ArangoDocumentController {

    @Autowired
    private ArangoDocumentService documentService;

    // ==================== Single Document Operations ====================

    @PostMapping("/{collection}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createDocument(
            @PathVariable String collection,
            @RequestBody Object document,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean silent,
            @RequestParam(required = false) String overwriteMode) {
        return documentService.createDocument(collection, document, waitForSync, 
            returnNew, returnOld, silent, overwriteMode);
    }

    @GetMapping("/{collection}/{key}")
    public Mono<Map> getDocument(
            @PathVariable String collection,
            @PathVariable String key,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        return documentService.getDocument(collection, key, ifNoneMatch, ifMatch);
    }

    @RequestMapping(value = "/{collection}/{key}", method = RequestMethod.HEAD)
    public Mono<Boolean> documentExists(
            @PathVariable String collection,
            @PathVariable String key,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        return documentService.documentExists(collection, key, ifNoneMatch, ifMatch);
    }

    @PutMapping("/{collection}/{key}")
    public Mono<Map> replaceDocument(
            @PathVariable String collection,
            @PathVariable String key,
            @RequestBody Object document,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean silent,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.replaceDocument(collection, key, document, waitForSync, 
            returnNew, returnOld, silent, ifMatch, ignoreRevs);
    }

    @PatchMapping("/{collection}/{key}")
    public Mono<Map> updateDocument(
            @PathVariable String collection,
            @PathVariable String key,
            @RequestBody Object document,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean silent,
            @RequestParam(required = false) Boolean keepNull,
            @RequestParam(required = false) Boolean mergeObjects,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.updateDocument(collection, key, document, waitForSync, 
            returnNew, returnOld, silent, keepNull, mergeObjects, ifMatch, ignoreRevs);
    }

    @DeleteMapping("/{collection}/{key}")
    public Mono<Map> deleteDocument(
            @PathVariable String collection,
            @PathVariable String key,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean silent,
            @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        return documentService.deleteDocument(collection, key, waitForSync, 
            returnOld, silent, ifMatch);
    }

    // ==================== Multiple Document Operations ====================

    @PostMapping("/{collection}/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<List> createDocuments(
            @PathVariable String collection,
            @RequestBody List<Object> documents,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean silent,
            @RequestParam(required = false) String overwriteMode) {
        return documentService.createDocuments(collection, documents, waitForSync, 
            returnNew, returnOld, silent, overwriteMode);
    }

    @PostMapping("/{collection}/lookup")
    public Mono<List> getDocuments(
            @PathVariable String collection,
            @RequestBody List<String> keys,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.getDocuments(collection, keys, ignoreRevs);
    }

    @PutMapping("/{collection}/batch")
    public Mono<List> replaceDocuments(
            @PathVariable String collection,
            @RequestBody List<Object> documents,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.replaceDocuments(collection, documents, waitForSync, 
            returnNew, returnOld, ignoreRevs);
    }

    @PatchMapping("/{collection}/batch")
    public Mono<List> updateDocuments(
            @PathVariable String collection,
            @RequestBody List<Object> documents,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnNew,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean keepNull,
            @RequestParam(required = false) Boolean mergeObjects,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.updateDocuments(collection, documents, waitForSync, 
            returnNew, returnOld, keepNull, mergeObjects, ignoreRevs);
    }

    @DeleteMapping("/{collection}/batch")
    public Mono<List> deleteDocuments(
            @PathVariable String collection,
            @RequestBody List<Object> selectors,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) Boolean returnOld,
            @RequestParam(required = false) Boolean ignoreRevs) {
        return documentService.deleteDocuments(collection, selectors, waitForSync, 
            returnOld, ignoreRevs);
    }
}
