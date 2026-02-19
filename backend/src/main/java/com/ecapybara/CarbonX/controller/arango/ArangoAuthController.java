package com.ecapybara.CarbonX.controller.arango;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoAuthService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Authentication operations.
 * Base path: /api/arango/auth
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/auth")
public class ArangoAuthController {

    @Autowired
    private ArangoAuthService authService;

    /**
     * Authenticate and get JWT token
     */
    @PostMapping("/login")
    public Mono<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        return authService.login(username, password);
    }

    /**
     * Get JWT token directly (raw authentication)
     */
    @PostMapping("/token")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> authenticate(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        return authService.authenticate(username, password);
    }

    /**
     * Verify if a JWT token is valid
     */
    @PostMapping("/verify")
    public Mono<Map<String, Object>> verifyToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        return authService.verifyToken(token)
                .map(valid -> {
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("valid", valid);
                    return result;
                });
    }

    /**
     * Get JWT secrets info
     */
    @GetMapping("/jwt")
    public Mono<Map> getJwtInfo() {
        return authService.getJwtInfo();
    }

    /**
     * Reload JWT secrets from disk
     */
    @PostMapping("/jwt/reload")
    public Mono<Map> reloadJwtSecrets() {
        return authService.reloadJwtSecrets();
    }
}
