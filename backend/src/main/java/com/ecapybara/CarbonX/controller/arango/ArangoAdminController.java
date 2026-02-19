package com.ecapybara.CarbonX.controller.arango;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoAdminService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Administration and Monitoring operations.
 * Base path: /api/arango/admin
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/admin")
public class ArangoAdminController {

    @Autowired
    private ArangoAdminService adminService;

    // ==================== Server Information ====================

    @GetMapping("/version")
    public Mono<Map> getVersion(@RequestParam(required = false) Boolean details) {
        return adminService.getVersion(details);
    }

    @GetMapping("/engine")
    public Mono<Map> getEngine() {
        return adminService.getEngine();
    }

    @GetMapping("/status")
    public Mono<Map> getStatus() {
        return adminService.getStatus();
    }

    @GetMapping("/time")
    public Mono<Map> getTime() {
        return adminService.getTime();
    }

    @GetMapping("/availability")
    public Mono<Map> checkAvailability() {
        return adminService.checkAvailability();
    }

    // ==================== Statistics & Metrics ====================

    @GetMapping("/statistics")
    public Mono<Map> getStatistics() {
        return adminService.getStatistics();
    }

    @GetMapping("/statistics-description")
    public Mono<Map> getStatisticsDescription() {
        return adminService.getStatisticsDescription();
    }

    @GetMapping("/metrics")
    public Mono<String> getMetrics(@RequestParam(required = false) String type) {
        return adminService.getMetrics(type);
    }

    @GetMapping("/usage-metrics")
    public Mono<Map> getUsageMetrics() {
        return adminService.getUsageMetrics();
    }

    // ==================== Logging ====================

    @GetMapping("/log/entries")
    public Mono<Map> getLogEntries(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long start,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long offset,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String serverId) {
        return adminService.getLogEntries(level, start, size, offset, search, sort, serverId);
    }

    @GetMapping("/log/level")
    public Mono<Map> getLogLevels(@RequestParam(required = false) String serverId) {
        return adminService.getLogLevels(serverId);
    }

    @PutMapping("/log/level")
    public Mono<Map> setLogLevels(
            @RequestBody Map<String, String> levels,
            @RequestParam(required = false) String serverId) {
        return adminService.setLogLevels(levels, serverId);
    }

    @DeleteMapping("/log/level")
    public Mono<Map> resetLogLevels(@RequestParam(required = false) String serverId) {
        return adminService.resetLogLevels(serverId);
    }

    // ==================== Server Mode ====================

    @GetMapping("/server/mode")
    public Mono<Map> getServerMode() {
        return adminService.getServerMode();
    }

    @PutMapping("/server/mode")
    public Mono<Map> setServerMode(@RequestBody Map<String, String> request) {
        String mode = request.get("mode");
        return adminService.setServerMode(mode);
    }

    // ==================== Maintenance Operations ====================

    @PutMapping("/compact")
    public Mono<Map> compactDatabases(
            @RequestParam(required = false) Boolean changeLevel,
            @RequestParam(required = false) Boolean compactBottomMostLevel) {
        return adminService.compactDatabases(changeLevel, compactBottomMostLevel);
    }

    @PostMapping("/routing/reload")
    public Mono<Map> reloadRouting() {
        return adminService.reloadRouting();
    }

    @PostMapping("/echo")
    public Mono<Map> echo(@RequestBody Map<String, Object> body) {
        return adminService.echo(body);
    }

    // ==================== Shutdown ====================

    @GetMapping("/shutdown")
    public Mono<Map> getShutdownProgress() {
        return adminService.getShutdownProgress();
    }

    @DeleteMapping("/shutdown")
    public Mono<Map> initiateShutdown(@RequestParam(required = false) Boolean soft) {
        return adminService.initiateShutdown(soft);
    }

    // ==================== License ====================

    @GetMapping("/license")
    public Mono<Map> getLicense() {
        return adminService.getLicense();
    }

    @PutMapping("/license")
    public Mono<Map> setLicense(@RequestBody Map<String, String> request) {
        String license = request.get("license");
        return adminService.setLicense(license);
    }

    // ==================== TLS/Security ====================

    @GetMapping("/server/tls")
    public Mono<Map> getTlsData() {
        return adminService.getTlsData();
    }

    @PostMapping("/server/tls")
    public Mono<Map> reloadTls() {
        return adminService.reloadTls();
    }

    // ==================== JWT ====================

    @GetMapping("/server/jwt")
    public Mono<Map> getJwtSecrets() {
        return adminService.getJwtSecrets();
    }

    @PostMapping("/server/jwt")
    public Mono<Map> reloadJwtSecrets() {
        return adminService.reloadJwtSecrets();
    }
}
