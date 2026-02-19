package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoReplicationService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Replication operations.
 * Base path: /api/arango/replication
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/replication")
public class ArangoReplicationController {

    @Autowired
    private ArangoReplicationService replicationService;

    // ==================== Replication State ====================

    @GetMapping("/server-id")
    public Mono<Map> getServerId() {
        return replicationService.getServerId();
    }

    @GetMapping("/logger-state")
    public Mono<Map> getLoggerState() {
        return replicationService.getLoggerState();
    }

    @GetMapping("/logger-first-tick")
    public Mono<Map> getFirstTick() {
        return replicationService.getFirstTick();
    }

    @GetMapping("/logger-tick-ranges")
    public Mono<Map> getTickRanges() {
        return replicationService.getTickRanges();
    }

    // ==================== Inventory ====================

    @GetMapping("/inventory")
    public Mono<Map> getInventory(
            @RequestParam(required = false) Boolean includeSystem,
            @RequestParam(required = false) Boolean includeFoxxQueues,
            @RequestParam(required = false) Long batchId) {
        return replicationService.getInventory(includeSystem, includeFoxxQueues, batchId);
    }

    @GetMapping("/cluster-inventory")
    public Mono<Map> getClusterInventory(
            @RequestParam(required = false) Boolean includeSystem) {
        return replicationService.getClusterInventory(includeSystem);
    }

    // ==================== Dump Batch ====================

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createBatch(@RequestBody Map<String, Object> request) {
        Integer ttl = (Integer) request.get("ttl");
        String state = (String) request.get("state");
        return replicationService.createBatch(ttl, state);
    }

    @PutMapping("/batch/{batchId}")
    public Mono<Map> extendBatch(
            @PathVariable String batchId,
            @RequestBody Map<String, Integer> request) {
        Integer ttl = request.get("ttl");
        return replicationService.extendBatch(batchId, ttl);
    }

    @DeleteMapping("/batch/{batchId}")
    public Mono<Map> deleteBatch(@PathVariable String batchId) {
        return replicationService.deleteBatch(batchId);
    }

    // ==================== Dump ====================

    @GetMapping("/dump")
    public Mono<String> getDump(
            @RequestParam(required = false) String collection,
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long chunkSize,
            @RequestParam(required = false) Boolean includeSystem,
            @RequestParam(required = false) Long ticks,
            @RequestParam(required = false) Boolean flush) {
        return replicationService.getDump(collection, batchId, chunkSize, 
            includeSystem, ticks, flush);
    }

    // ==================== WAL Operations ====================

    @GetMapping("/wal/last-tick")
    public Mono<Map> getLastTick() {
        return replicationService.getLastTick();
    }

    @GetMapping("/wal/range")
    public Mono<Map> getWalRange() {
        return replicationService.getWalRange();
    }

    @GetMapping("/wal/tail")
    public Mono<String> tailWal(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @RequestParam(required = false) Long lastScanned,
            @RequestParam(required = false) Long chunkSize,
            @RequestParam(required = false) Boolean includeSystem,
            @RequestParam(required = false) String serverId) {
        return replicationService.tailWal(from, to, lastScanned, chunkSize, 
            includeSystem, serverId);
    }

    // ==================== Applier ====================

    @GetMapping("/applier-config")
    public Mono<Map> getApplierConfig() {
        return replicationService.getApplierConfig();
    }

    @PutMapping("/applier-config")
    public Mono<Map> setApplierConfig(@RequestBody Map<String, Object> config) {
        String endpoint = (String) config.get("endpoint");
        String database = (String) config.get("database");
        String username = (String) config.get("username");
        String password = (String) config.get("password");
        Integer maxConnectRetries = (Integer) config.get("maxConnectRetries");
        Integer connectTimeout = (Integer) config.get("connectTimeout");
        Integer requestTimeout = (Integer) config.get("requestTimeout");
        Integer chunkSize = (Integer) config.get("chunkSize");
        Boolean autoStart = (Boolean) config.get("autoStart");
        Boolean adaptivePolling = (Boolean) config.get("adaptivePolling");
        Boolean includeSystem = (Boolean) config.get("includeSystem");
        Boolean autoResync = (Boolean) config.get("autoResync");
        Boolean autoResyncRetries = (Boolean) config.get("autoResyncRetries");
        Integer initialSyncMaxWaitTime = (Integer) config.get("initialSyncMaxWaitTime");
        Integer connectionRetryWaitTime = (Integer) config.get("connectionRetryWaitTime");
        Integer idleMinWaitTime = (Integer) config.get("idleMinWaitTime");
        Integer idleMaxWaitTime = (Integer) config.get("idleMaxWaitTime");
        
        return replicationService.setApplierConfig(endpoint, database, username, password,
            maxConnectRetries, connectTimeout, requestTimeout, chunkSize, autoStart,
            adaptivePolling, includeSystem, autoResync, autoResyncRetries,
            initialSyncMaxWaitTime, connectionRetryWaitTime, idleMinWaitTime, idleMaxWaitTime);
    }

    @GetMapping("/applier-state")
    public Mono<Map> getApplierState() {
        return replicationService.getApplierState();
    }

    @PutMapping("/applier-start")
    public Mono<Map> startApplier(@RequestParam(required = false) Long from) {
        return replicationService.startApplier(from);
    }

    @PutMapping("/applier-stop")
    public Mono<Map> stopApplier() {
        return replicationService.stopApplier();
    }

    // ==================== Sync ====================

    @PutMapping("/sync")
    public Mono<Map> sync(@RequestBody Map<String, Object> request) {
        String endpoint = (String) request.get("endpoint");
        String database = (String) request.get("database");
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        Boolean includeSystem = (Boolean) request.get("includeSystem");
        Boolean incremental = (Boolean) request.get("incremental");
        String restrictType = (String) request.get("restrictType");
        List<String> restrictCollections = (List<String>) request.get("restrictCollections");
        
        return replicationService.sync(endpoint, database, username, password,
            includeSystem, incremental, restrictType, restrictCollections);
    }

    @PutMapping("/make-follower")
    public Mono<Map> makeFollower(@RequestBody Map<String, Object> request) {
        String endpoint = (String) request.get("endpoint");
        String database = (String) request.get("database");
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        Boolean includeSystem = (Boolean) request.get("includeSystem");
        String restrictType = (String) request.get("restrictType");
        List<String> restrictCollections = (List<String>) request.get("restrictCollections");
        
        return replicationService.makeFollower(endpoint, database, username, password,
            includeSystem, restrictType, restrictCollections);
    }
}
