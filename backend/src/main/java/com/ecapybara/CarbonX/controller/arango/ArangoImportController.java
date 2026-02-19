package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoImportService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Import, Batch, Jobs, and Tasks operations.
 * Base path: /api/arango/import
 */
@Slf4j
@RestController
@RequestMapping("/api/arango")
public class ArangoImportController {

    @Autowired
    private ArangoImportService importService;

    // ==================== JSON Import ====================

    @PostMapping("/import/{collection}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> importDocuments(
            @PathVariable String collection,
            @RequestBody List<Object> documents,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String fromPrefix,
            @RequestParam(required = false) String toPrefix,
            @RequestParam(required = false) Boolean overwrite,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) String onDuplicate,
            @RequestParam(required = false) Boolean complete,
            @RequestParam(required = false) Boolean details) {
        return importService.importDocuments(collection, documents, type, fromPrefix, toPrefix,
            overwrite, waitForSync, onDuplicate, complete, details);
    }

    @PostMapping("/import/{collection}/jsonl")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> importJsonLines(
            @PathVariable String collection,
            @RequestBody String jsonLines,
            @RequestParam(required = false) String fromPrefix,
            @RequestParam(required = false) String toPrefix,
            @RequestParam(required = false) Boolean overwrite,
            @RequestParam(required = false) Boolean waitForSync,
            @RequestParam(required = false) String onDuplicate,
            @RequestParam(required = false) Boolean complete,
            @RequestParam(required = false) Boolean details) {
        return importService.importJsonLines(collection, jsonLines, fromPrefix, toPrefix,
            overwrite, waitForSync, onDuplicate, complete, details);
    }

    // ==================== Async Jobs ====================

    @GetMapping("/jobs/{type}")
    public Mono<Map> listAsyncJobs(
            @PathVariable String type,
            @RequestParam(required = false) Integer count) {
        return importService.listAsyncJobs(type, count);
    }

    @GetMapping("/jobs/status/{jobId}")
    public Mono<Map> getAsyncJobStatus(@PathVariable String jobId) {
        return importService.getAsyncJobStatus(jobId);
    }

    @PutMapping("/jobs/{jobId}/result")
    public Mono<Map> getAsyncJobResult(@PathVariable String jobId) {
        return importService.getAsyncJobResult(jobId);
    }

    @PutMapping("/jobs/{jobId}/cancel")
    public Mono<Map> cancelAsyncJob(@PathVariable String jobId) {
        return importService.cancelAsyncJob(jobId);
    }

    @DeleteMapping("/jobs/{type}")
    public Mono<Map> deleteAsyncJobResults(
            @PathVariable String type,
            @RequestParam(required = false) Long stamp) {
        return importService.deleteAsyncJobResults(type, stamp);
    }

    // ==================== Scheduled Tasks ====================

    @GetMapping("/tasks")
    public Mono<Map> listTasks() {
        return importService.listTasks();
    }

    @GetMapping("/tasks/{taskId}")
    public Mono<Map> getTask(@PathVariable String taskId) {
        return importService.getTask(taskId);
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createTask(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String command = (String) request.get("command");
        Map<String, Object> params = (Map<String, Object>) request.get("params");
        Integer period = (Integer) request.get("period");
        Integer offset = (Integer) request.get("offset");
        
        return importService.createTask(name, command, params, period, offset);
    }

    @PutMapping("/tasks/{taskId}")
    public Mono<Map> createTaskWithId(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String command = (String) request.get("command");
        Map<String, Object> params = (Map<String, Object>) request.get("params");
        Integer period = (Integer) request.get("period");
        Integer offset = (Integer) request.get("offset");
        
        return importService.createTaskWithId(taskId, name, command, params, period, offset);
    }

    @DeleteMapping("/tasks/{taskId}")
    public Mono<Map> deleteTask(@PathVariable String taskId) {
        return importService.deleteTask(taskId);
    }
}
