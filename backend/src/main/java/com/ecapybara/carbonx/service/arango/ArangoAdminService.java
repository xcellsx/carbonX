package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for ArangoDB Administration and Monitoring operations.
 * Provides methods for server management, logging, statistics, and metrics.
 */
@Slf4j
@Service
public class ArangoAdminService extends BaseArangoService {

    // ==================== Server Information ====================

    /**
     * Get server version
     * GET /_api/version
     */
    public Mono<Map> getVersion(Boolean details) {
        log.info("Getting server version");
        String uri = details != null && details ? "/version?details=true" : "/version";
        return get(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved server version"));
    }

    /**
     * Get storage engine type
     * GET /_api/engine
     */
    public Mono<Map> getEngine() {
        log.info("Getting storage engine type");
        return get("/engine", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved storage engine type"));
    }

    /**
     * Get server status information
     * GET /_admin/status
     */
    public Mono<Map> getStatus() {
        log.info("Getting server status");
        return get("/_admin/status", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved server status"));
    }

    /**
     * Get system time
     * GET /_admin/time
     */
    public Mono<Map> getTime() {
        log.info("Getting system time");
        return get("/_admin/time", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved system time"));
    }

    /**
     * Check server availability
     * GET /_admin/server/availability
     */
    public Mono<Map> checkAvailability() {
        log.info("Checking server availability");
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("localhost")
                        .port(8529)
                        .path("/_admin/server/availability")
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully checked server availability"));
    }

    // ==================== Statistics & Metrics ====================

    /**
     * Get server statistics
     * GET /_admin/statistics
     */
    public Mono<Map> getStatistics() {
        log.info("Getting server statistics");
        return get("/_admin/statistics", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved server statistics"));
    }

    /**
     * Get statistics description
     * GET /_admin/statistics-description
     */
    public Mono<Map> getStatisticsDescription() {
        log.info("Getting statistics description");
        return get("/_admin/statistics-description", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved statistics description"));
    }

    /**
     * Get metrics (v2)
     * GET /_admin/metrics/v2
     */
    public Mono<String> getMetrics(String type) {
        log.info("Getting metrics - type: {}", type);
        StringBuilder uri = new StringBuilder("/_admin/metrics/v2");
        if (type != null) {
            uri.append("?type=").append(type);
        }
        return webClient.get()
                .uri(uri.toString())
                .retrieve()
                .bodyToMono(String.class) // Metrics are returned in Prometheus format
                .doOnSuccess(result -> log.info("Successfully retrieved metrics"));
    }

    /**
     * Get usage metrics
     * GET /_admin/usage-metrics
     */
    public Mono<Map> getUsageMetrics() {
        log.info("Getting usage metrics");
        return get("/_admin/usage-metrics", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved usage metrics"));
    }

    // ==================== Logging ====================

    /**
     * Get server log entries
     * GET /_admin/log/entries
     */
    public Mono<Map> getLogEntries(String level, Long start, Integer size,
                                    Long offset, String search, String sort,
                                    String serverId) {
        log.info("Getting log entries");
        StringBuilder uri = new StringBuilder();
        // Need to use absolute URI for admin endpoints
        uri.append("http://localhost:8529/_admin/log/entries");
        String separator = "?";
        
        if (level != null) {
            uri.append(separator).append("level=").append(level);
            separator = "&";
        }
        if (start != null) {
            uri.append(separator).append("start=").append(start);
            separator = "&";
        }
        if (size != null) {
            uri.append(separator).append("size=").append(size);
            separator = "&";
        }
        if (offset != null) {
            uri.append(separator).append("offset=").append(offset);
            separator = "&";
        }
        if (search != null) {
            uri.append(separator).append("search=").append(search);
            separator = "&";
        }
        if (sort != null) {
            uri.append(separator).append("sort=").append(sort);
            separator = "&";
        }
        if (serverId != null) {
            uri.append(separator).append("serverId=").append(serverId);
        }

        return webClient.get()
                .uri(uri.toString())
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved log entries"));
    }

    /**
     * Get server log levels
     * GET /_admin/log/level
     */
    public Mono<Map> getLogLevels(String serverId) {
        log.info("Getting log levels");
        String uri = serverId != null 
            ? "http://localhost:8529/_admin/log/level?serverId=" + serverId
            : "http://localhost:8529/_admin/log/level";
        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved log levels"));
    }

    /**
     * Set server log levels
     * PUT /_admin/log/level
     */
    public Mono<Map> setLogLevels(Map<String, String> levels, String serverId) {
        log.info("Setting log levels: {}", levels);
        String uri = serverId != null 
            ? "http://localhost:8529/_admin/log/level?serverId=" + serverId
            : "http://localhost:8529/_admin/log/level";
        return webClient.put()
                .uri(uri)
                .bodyValue(levels)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully set log levels"));
    }

    /**
     * Reset server log levels
     * DELETE /_admin/log/level
     */
    public Mono<Map> resetLogLevels(String serverId) {
        log.info("Resetting log levels");
        String uri = serverId != null 
            ? "http://localhost:8529/_admin/log/level?serverId=" + serverId
            : "http://localhost:8529/_admin/log/level";
        return webClient.delete()
                .uri(uri)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully reset log levels"));
    }

    // ==================== Server Mode ====================

    /**
     * Get server mode (read-only or default)
     * GET /_admin/server/mode
     */
    public Mono<Map> getServerMode() {
        log.info("Getting server mode");
        return get("/_admin/server/mode", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved server mode"));
    }

    /**
     * Set server mode
     * PUT /_admin/server/mode
     */
    public Mono<Map> setServerMode(String mode) {
        log.info("Setting server mode to: {}", mode);
        Map<String, Object> body = new HashMap<>();
        body.put("mode", mode); // "default" or "readonly"
        return put("/_admin/server/mode", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully set server mode to: {}", mode));
    }

    // ==================== Maintenance Operations ====================

    /**
     * Compact all databases
     * PUT /_admin/compact
     */
    public Mono<Map> compactDatabases(Boolean changeLevel, Boolean compactBottomMostLevel) {
        log.info("Compacting all databases");
        Map<String, Object> body = new HashMap<>();
        if (changeLevel != null) body.put("changeLevel", changeLevel);
        if (compactBottomMostLevel != null) body.put("compactBottomMostLevel", compactBottomMostLevel);
        
        return webClient.put()
                .uri("http://localhost:8529/_admin/compact")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully compacted databases"));
    }

    /**
     * Reload routing table
     * POST /_admin/routing/reload
     */
    public Mono<Map> reloadRouting() {
        log.info("Reloading routing table");
        return post("/_admin/routing/reload", new HashMap<>(), Map.class)
                .doOnSuccess(result -> log.info("Successfully reloaded routing table"));
    }

    /**
     * Echo a request (for testing)
     * POST /_admin/echo
     */
    public Mono<Map> echo(Map<String, Object> body) {
        log.info("Sending echo request");
        return post("/_admin/echo", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully received echo response"));
    }

    // ==================== Shutdown ====================

    /**
     * Query soft shutdown progress
     * GET /_admin/shutdown
     */
    public Mono<Map> getShutdownProgress() {
        log.info("Getting shutdown progress");
        return get("/_admin/shutdown", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved shutdown progress"));
    }

    /**
     * Start shutdown sequence (USE WITH CAUTION)
     * DELETE /_admin/shutdown
     */
    public Mono<Map> initiateShutdown(Boolean soft) {
        log.warn("INITIATING SERVER SHUTDOWN - soft: {}", soft);
        String uri = soft != null && soft 
            ? "/_admin/shutdown?soft=true"
            : "/_admin/shutdown";
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.warn("Successfully initiated server shutdown"));
    }

    // ==================== License ====================

    /**
     * Get license information
     * GET /_admin/license
     */
    public Mono<Map> getLicense() {
        log.info("Getting license information");
        return get("/_admin/license", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved license information"));
    }

    /**
     * Set license
     * PUT /_admin/license
     */
    public Mono<Map> setLicense(String license) {
        log.info("Setting license");
        Map<String, Object> body = new HashMap<>();
        body.put("license", license);
        return put("/_admin/license", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully set license"));
    }

    // ==================== TLS/Security ====================

    /**
     * Get TLS data
     * GET /_admin/server/tls
     */
    public Mono<Map> getTlsData() {
        log.info("Getting TLS data");
        return get("/_admin/server/tls", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved TLS data"));
    }

    /**
     * Reload TLS data
     * POST /_admin/server/tls
     */
    public Mono<Map> reloadTls() {
        log.info("Reloading TLS data");
        return post("/_admin/server/tls", new HashMap<>(), Map.class)
                .doOnSuccess(result -> log.info("Successfully reloaded TLS data"));
    }

    // ==================== JWT ====================

    /**
     * Get JWT secrets info
     * GET /_admin/server/jwt
     */
    public Mono<Map> getJwtSecrets() {
        log.info("Getting JWT secrets info");
        return get("/_admin/server/jwt", Map.class)
                .doOnSuccess(result -> log.info("Successfully retrieved JWT secrets info"));
    }

    /**
     * Hot-reload JWT secrets from disk
     * POST /_admin/server/jwt
     */
    public Mono<Map> reloadJwtSecrets() {
        log.info("Reloading JWT secrets");
        return webClient.post()
                .uri("http://localhost:8529/_admin/server/jwt")
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(result -> log.info("Successfully reloaded JWT secrets"));
    }
}
