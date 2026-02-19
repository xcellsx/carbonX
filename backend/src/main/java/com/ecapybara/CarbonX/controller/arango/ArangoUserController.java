package com.ecapybara.CarbonX.controller.arango;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoUserService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB User management operations.
 * Base path: /api/arango/users
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/users")
public class ArangoUserController {

    @Autowired
    private ArangoUserService userService;

    // ==================== User CRUD ====================

    @GetMapping
    public Mono<Map> listUsers() {
        return userService.listUsers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createUser(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("user");
        String password = (String) request.get("passwd");
        Boolean active = (Boolean) request.get("active");
        Map<String, Object> extra = (Map<String, Object>) request.get("extra");
        
        return userService.createUser(username, password, active, extra);
    }

    @GetMapping("/{username}")
    public Mono<Map> getUser(@PathVariable String username) {
        return userService.getUser(username);
    }

    @PatchMapping("/{username}")
    public Mono<Map> updateUser(
            @PathVariable String username,
            @RequestBody Map<String, Object> request) {
        String password = (String) request.get("passwd");
        Boolean active = (Boolean) request.get("active");
        Map<String, Object> extra = (Map<String, Object>) request.get("extra");
        
        return userService.updateUser(username, password, active, extra);
    }

    @PutMapping("/{username}")
    public Mono<Map> replaceUser(
            @PathVariable String username,
            @RequestBody Map<String, Object> request) {
        String password = (String) request.get("passwd");
        Boolean active = (Boolean) request.get("active");
        Map<String, Object> extra = (Map<String, Object>) request.get("extra");
        
        return userService.replaceUser(username, password, active, extra);
    }

    @DeleteMapping("/{username}")
    public Mono<Map> deleteUser(@PathVariable String username) {
        return userService.deleteUser(username);
    }

    // ==================== Database Access Levels ====================

    @GetMapping("/{username}/database")
    public Mono<Map> getUserDatabases(
            @PathVariable String username,
            @RequestParam(required = false) Boolean full) {
        return userService.getUserDatabases(username, full);
    }

    @GetMapping("/{username}/database/{database}")
    public Mono<Map> getDatabaseAccessLevel(
            @PathVariable String username,
            @PathVariable String database) {
        return userService.getDatabaseAccessLevel(username, database);
    }

    @PutMapping("/{username}/database/{database}")
    public Mono<Map> setDatabaseAccessLevel(
            @PathVariable String username,
            @PathVariable String database,
            @RequestBody Map<String, String> request) {
        String grant = request.get("grant");
        return userService.setDatabaseAccessLevel(username, database, grant);
    }

    @DeleteMapping("/{username}/database/{database}")
    public Mono<Map> clearDatabaseAccessLevel(
            @PathVariable String username,
            @PathVariable String database) {
        return userService.clearDatabaseAccessLevel(username, database);
    }

    // ==================== Collection Access Levels ====================

    @GetMapping("/{username}/database/{database}/{collection}")
    public Mono<Map> getCollectionAccessLevel(
            @PathVariable String username,
            @PathVariable String database,
            @PathVariable String collection) {
        return userService.getCollectionAccessLevel(username, database, collection);
    }

    @PutMapping("/{username}/database/{database}/{collection}")
    public Mono<Map> setCollectionAccessLevel(
            @PathVariable String username,
            @PathVariable String database,
            @PathVariable String collection,
            @RequestBody Map<String, String> request) {
        String grant = request.get("grant");
        return userService.setCollectionAccessLevel(username, database, collection, grant);
    }

    @DeleteMapping("/{username}/database/{database}/{collection}")
    public Mono<Map> clearCollectionAccessLevel(
            @PathVariable String username,
            @PathVariable String database,
            @PathVariable String collection) {
        return userService.clearCollectionAccessLevel(username, database, collection);
    }
}
