package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoDatabaseService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Database management operations.
 * Base path: /api/arango/databases
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/databases")
public class ArangoDatabaseController {

    @Autowired
    private ArangoDatabaseService databaseService;

    @GetMapping
    public Mono<Map> listDatabases() {
        return databaseService.listDatabases();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createDatabase(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<Map<String, Object>> users = (List<Map<String, Object>>) request.get("users");
        
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        Integer replicationFactor = options != null ? (Integer) options.get("replicationFactor") : null;
        Integer writeConcern = options != null ? (Integer) options.get("writeConcern") : null;
        String sharding = options != null ? (String) options.get("sharding") : null;
        
        return databaseService.createDatabase(name, users, replicationFactor, writeConcern, sharding);
    }

    @DeleteMapping("/{databaseName}")
    public Mono<Map> dropDatabase(@PathVariable String databaseName) {
        return databaseService.dropDatabase(databaseName);
    }

    @GetMapping("/current")
    public Mono<Map> getCurrentDatabase() {
        return databaseService.getCurrentDatabase();
    }

    @GetMapping("/user")
    public Mono<Map> getUserDatabases() {
        return databaseService.getUserDatabases();
    }
}
