package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for ArangoDB Authentication operations.
 * Provides methods for JWT token management and authentication.
 */
@Slf4j
@Service
public class ArangoAuthService extends BaseArangoService {

    /**
     * Create a JWT session token
     * POST /_open/auth
     * 
     * This endpoint is open and does not require authentication.
     */
    public Mono<Map> authenticate(String username, String password) {
        log.info("Authenticating user: {}", username);
        
        Map<String, Object> body = new HashMap<>();
        body.put("username", username);
        body.put("password", password);

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_open/auth")
                        .build())
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully authenticated user: {}", username))
                .doOnError(error -> log.error("Authentication failed for user: {}", username, error));
    }

    /**
     * Get information about loaded JWT secrets
     * GET /_admin/server/jwt
     */
    public Mono<Map> getJwtInfo() {
        log.info("Getting JWT secrets info");
        return get("/_admin/server/jwt", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved JWT info"));
    }

    /**
     * Hot-reload JWT secrets from disk
     * POST /_admin/server/jwt
     */
    public Mono<Map> reloadJwtSecrets() {
        log.info("Reloading JWT secrets from disk");
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_admin/server/jwt")
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully reloaded JWT secrets"));
    }

    /**
     * Verify a JWT token by making a test request
     * This is a helper method that attempts to access a protected endpoint
     */
    public Mono<Boolean> verifyToken(String jwtToken) {
        log.info("Verifying JWT token");
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_api/version")
                        .build())
                .header("Authorization", "bearer " + jwtToken)
                .exchangeToMono(response -> Mono.just(response.statusCode().is2xxSuccessful()))
                .doOnSuccess(valid -> log.info("JWT token verification result: {}", valid));
    }

    /**
     * Create a WebClient configured with JWT token for subsequent requests
     * Returns a map with the token that can be used by the frontend
     */
    public Mono<Map<String, Object>> login(String username, String password) {
        log.info("Logging in user: {}", username);
        
        return authenticate(username, password)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("jwt", response.get("jwt"));
                    result.put("username", username);
                    result.put("authenticated", true);
                    return result;
                })
                .doOnSuccess(result -> log.info("Login successful for user: {}", username))
                .onErrorResume(error -> {
                    log.error("Login failed for user: {}", username, error);
                    Map<String, Object> result = new HashMap<>();
                    result.put("authenticated", false);
                    result.put("error", error.getMessage());
                    return Mono.just(result);
                });
    }
}
