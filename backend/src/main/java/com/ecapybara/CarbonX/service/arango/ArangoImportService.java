package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Import and Batch operations.
 * Provides methods for bulk data import and batch requests.
 */
@Slf4j
@Service
public class ArangoImportService extends BaseArangoService {

    // ==================== JSON Import ====================

    /**
     * Import JSON data as documents
     * POST /_api/import
     * 
     * @param collection Target collection
     * @param documents List of documents to import (JSON array)
     * @param type Import type: "documents", "list", or "auto"
     * @param fromPrefix Prefix for _from attribute (edge collections)
     * @param toPrefix Prefix for _to attribute (edge collections)
     * @param overwrite If true, removes all existing data before import
     * @param waitForSync Wait for sync to disk
     * @param onDuplicate Handle duplicates: "error", "update", "replace", "ignore"
     * @param complete If true, fails entire import on any error
     * @param details If true, returns more detailed error info
     */
    public Mono<Map> importDocuments(String collection, List<Object> documents,
                                      String type, String fromPrefix, String toPrefix,
                                      Boolean overwrite, Boolean waitForSync,
                                      String onDuplicate, Boolean complete, Boolean details) {
        log.info("Importing {} documents to collection: {}", documents.size(), collection);
        
        StringBuilder uri = new StringBuilder("/import?collection=" + collection);
        
        if (type != null) uri.append("&type=").append(type);
        if (fromPrefix != null) uri.append("&fromPrefix=").append(fromPrefix);
        if (toPrefix != null) uri.append("&toPrefix=").append(toPrefix);
        if (overwrite != null) uri.append("&overwrite=").append(overwrite);
        if (waitForSync != null) uri.append("&waitForSync=").append(waitForSync);
        if (onDuplicate != null) uri.append("&onDuplicate=").append(onDuplicate);
        if (complete != null) uri.append("&complete=").append(complete);
        if (details != null) uri.append("&details=").append(details);

        return post(uri.toString(), documents, Map.class)
                .doOnSuccess(result -> log.info("Successfully imported documents to collection: {}", collection));
    }

    /**
     * Import JSON lines (JSONL format)
     * POST /_api/import
     */
    public Mono<Map> importJsonLines(String collection, String jsonLines,
                                      String fromPrefix, String toPrefix,
                                      Boolean overwrite, Boolean waitForSync,
                                      String onDuplicate, Boolean complete, Boolean details) {
        log.info("Importing JSONL data to collection: {}", collection);
        
        StringBuilder uri = new StringBuilder("/import?collection=" + collection + "&type=documents");
        
        if (fromPrefix != null) uri.append("&fromPrefix=").append(fromPrefix);
        if (toPrefix != null) uri.append("&toPrefix=").append(toPrefix);
        if (overwrite != null) uri.append("&overwrite=").append(overwrite);
        if (waitForSync != null) uri.append("&waitForSync=").append(waitForSync);
        if (onDuplicate != null) uri.append("&onDuplicate=").append(onDuplicate);
        if (complete != null) uri.append("&complete=").append(complete);
        if (details != null) uri.append("&details=").append(details);

        return webClient.post()
                .uri(uri.toString())
                .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                .bodyValue(jsonLines)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully imported JSONL to collection: {}", collection));
    }

    // ==================== Batch Requests ====================

    /**
     * Execute a batch request (multiple operations in one HTTP request)
     * POST /_api/batch
     * 
     * Note: The batch body should be in multipart/form-data format
     * This is a simplified version; for full multipart support, 
     * consider using a dedicated multipart library
     */
    public Mono<String> executeBatch(String batchBody, String boundary) {
        log.info("Executing batch request");
        
        return webClient.post()
                .uri("/batch")
                .contentType(org.springframework.http.MediaType.parseMediaType(
                    "multipart/form-data; boundary=" + boundary))
                .bodyValue(batchBody)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(result -> log.info("Successfully executed batch request"));
    }

    // ==================== Async Jobs ====================

    /**
     * List async jobs by status
     * GET /_api/job/{job-id}
     * 
     * @param type "pending" or "done"
     * @param count Maximum number of jobs to return
     */
    public Mono<Map> listAsyncJobs(String type, Integer count) {
        log.info("Listing async jobs - type: {}", type);
        StringBuilder uri = new StringBuilder("/job/" + type);
        if (count != null) {
            uri.append("?count=").append(count);
        }
        return get(uri.toString(), Map.class)
                .doOnSuccess(result -> log.info("Successfully listed async jobs"));
    }

    /**
     * Get the status of a specific async job
     * GET /_api/job/{job-id}
     */
    public Mono<Map> getAsyncJobStatus(String jobId) {
        log.info("Getting status for async job: {}", jobId);
        return get("/job/{id}", Map.class, jobId)
                .doOnSuccess(result -> log.info("Successfully retrieved job status: {}", jobId));
    }

    /**
     * Get the results of an async job
     * PUT /_api/job/{job-id}
     */
    public Mono<Map> getAsyncJobResult(String jobId) {
        log.info("Getting results for async job: {}", jobId);
        return webClient.put()
                .uri("/job/{id}", jobId)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved job results: {}", jobId));
    }

    /**
     * Cancel an async job
     * PUT /_api/job/{job-id}/cancel
     */
    public Mono<Map> cancelAsyncJob(String jobId) {
        log.info("Canceling async job: {}", jobId);
        return webClient.put()
                .uri("/job/{id}/cancel", jobId)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully canceled job: {}", jobId));
    }

    /**
     * Delete async job results
     * DELETE /_api/job/{job-id}
     * 
     * @param type Can be "all", "expired", or a specific job ID
     * @param stamp Timestamp for "expired" type
     */
    public Mono<Map> deleteAsyncJobResults(String type, Long stamp) {
        log.info("Deleting async job results - type: {}", type);
        String uri = stamp != null 
            ? "/job/" + type + "?stamp=" + stamp
            : "/job/" + type;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully deleted job results"));
    }

    // ==================== Scheduled Tasks ====================

    /**
     * List all tasks
     * GET /_api/tasks/
     */
    public Mono<Map> listTasks() {
        log.info("Listing all tasks");
        return get("/tasks/", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed tasks"));
    }

    /**
     * Get a specific task
     * GET /_api/tasks/{id}
     */
    public Mono<Map> getTask(String taskId) {
        log.info("Getting task: {}", taskId);
        return get("/tasks/{id}", Map.class, taskId)
                .doOnSuccess(result -> log.info("Successfully retrieved task: {}", taskId));
    }

    /**
     * Create a task
     * POST /_api/tasks
     */
    public Mono<Map> createTask(String name, String command, Map<String, Object> params,
                                 Integer period, Integer offset) {
        log.info("Creating task: {}", name);
        
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("name", name);
        body.put("command", command);
        
        if (params != null) body.put("params", params);
        if (period != null) body.put("period", period);
        if (offset != null) body.put("offset", offset);

        return post("/tasks", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created task: {}", name));
    }

    /**
     * Create a task with specific ID
     * PUT /_api/tasks/{id}
     */
    public Mono<Map> createTaskWithId(String taskId, String name, String command,
                                       Map<String, Object> params, Integer period, Integer offset) {
        log.info("Creating task with ID: {}", taskId);
        
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("name", name);
        body.put("command", command);
        
        if (params != null) body.put("params", params);
        if (period != null) body.put("period", period);
        if (offset != null) body.put("offset", offset);

        return put("/tasks/{id}", body, Map.class, taskId)
                .doOnSuccess(result -> log.info("Successfully created task: {}", taskId));
    }

    /**
     * Delete a task
     * DELETE /_api/tasks/{id}
     */
    public Mono<Map> deleteTask(String taskId) {
        log.info("Deleting task: {}", taskId);
        return delete("/tasks/{id}", Map.class, taskId)
                .doOnSuccess(result -> log.info("Successfully deleted task: {}", taskId));
    }
}
