package com.ecapybara.carbonx.service.arango;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for ArangoDB Analyzer operations.
 * Provides methods for creating and managing text analyzers for ArangoSearch.
 */
@Slf4j
@Service
public class ArangoAnalyzerService extends BaseArangoService {

    // ==================== Analyzer CRUD ====================

    /**
     * List all analyzers
     * GET /_api/analyzer
     */
    public Mono<Map> listAnalyzers() {
        log.info("Listing all analyzers");
        return get("/analyzer", Map.class)
                .doOnSuccess(result -> log.info("Successfully listed analyzers"));
    }

    /**
     * Get an analyzer definition
     * GET /_api/analyzer/{analyzer-name}
     */
    public Mono<Map> getAnalyzer(String analyzerName) {
        log.info("Getting analyzer: {}", analyzerName);
        return get("/analyzer/{name}", Map.class, analyzerName)
                .doOnSuccess(result -> log.info("Successfully retrieved analyzer: {}", analyzerName));
    }

    /**
     * Create an analyzer
     * POST /_api/analyzer
     */
    public Mono<Map> createAnalyzer(String name, String type, 
                                     Map<String, Object> properties,
                                     List<String> features) {
        log.info("Creating analyzer: {}, type: {}", name, type);
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("type", type);
        
        if (properties != null) body.put("properties", properties);
        if (features != null) body.put("features", features);

        return post("/analyzer", body, Map.class)
                .doOnSuccess(result -> log.info("Successfully created analyzer: {}", name));
    }

    /**
     * Remove an analyzer
     * DELETE /_api/analyzer/{analyzer-name}
     */
    public Mono<Map> deleteAnalyzer(String analyzerName, Boolean force) {
        log.info("Deleting analyzer: {}, force: {}", analyzerName, force);
        String uri = force != null && force 
            ? "/analyzer/" + analyzerName + "?force=true"
            : "/analyzer/" + analyzerName;
        return delete(uri, Map.class)
                .doOnSuccess(result -> log.info("Successfully deleted analyzer: {}", analyzerName));
    }

    // ==================== Common Analyzer Types ====================

    /**
     * Create an identity analyzer (no transformation)
     */
    public Mono<Map> createIdentityAnalyzer(String name, List<String> features) {
        log.info("Creating identity analyzer: {}", name);
        return createAnalyzer(name, "identity", null, features);
    }

    /**
     * Create a text analyzer
     */
    public Mono<Map> createTextAnalyzer(String name, String locale, 
                                         Boolean accent, String caseHandling,
                                         String stemming, List<String> stopwords,
                                         List<String> features) {
        log.info("Creating text analyzer: {}, locale: {}", name, locale);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("locale", locale);
        if (accent != null) properties.put("accent", accent);
        if (caseHandling != null) properties.put("case", caseHandling);
        if (stemming != null) properties.put("stemming", stemming);
        if (stopwords != null) properties.put("stopwords", stopwords);

        return createAnalyzer(name, "text", properties, features);
    }

    /**
     * Create a delimiter analyzer
     */
    public Mono<Map> createDelimiterAnalyzer(String name, String delimiter,
                                              List<String> features) {
        log.info("Creating delimiter analyzer: {}, delimiter: {}", name, delimiter);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("delimiter", delimiter);

        return createAnalyzer(name, "delimiter", properties, features);
    }

    /**
     * Create a stem analyzer
     */
    public Mono<Map> createStemAnalyzer(String name, String locale,
                                         List<String> features) {
        log.info("Creating stem analyzer: {}, locale: {}", name, locale);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("locale", locale);

        return createAnalyzer(name, "stem", properties, features);
    }

    /**
     * Create a norm analyzer
     */
    public Mono<Map> createNormAnalyzer(String name, String locale,
                                         Boolean accent, String caseHandling,
                                         List<String> features) {
        log.info("Creating norm analyzer: {}, locale: {}", name, locale);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("locale", locale);
        if (accent != null) properties.put("accent", accent);
        if (caseHandling != null) properties.put("case", caseHandling);

        return createAnalyzer(name, "norm", properties, features);
    }

    /**
     * Create an ngram analyzer
     */
    public Mono<Map> createNgramAnalyzer(String name, Integer min, Integer max,
                                          Boolean preserveOriginal, String startMarker,
                                          String endMarker, String streamType,
                                          List<String> features) {
        log.info("Creating ngram analyzer: {}, min: {}, max: {}", name, min, max);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("min", min != null ? min : 2);
        properties.put("max", max != null ? max : 3);
        if (preserveOriginal != null) properties.put("preserveOriginal", preserveOriginal);
        if (startMarker != null) properties.put("startMarker", startMarker);
        if (endMarker != null) properties.put("endMarker", endMarker);
        if (streamType != null) properties.put("streamType", streamType);

        return createAnalyzer(name, "ngram", properties, features);
    }

    /**
     * Create a pipeline analyzer (chain of analyzers)
     */
    public Mono<Map> createPipelineAnalyzer(String name, List<Map<String, Object>> pipeline,
                                             List<String> features) {
        log.info("Creating pipeline analyzer: {}", name);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("pipeline", pipeline);

        return createAnalyzer(name, "pipeline", properties, features);
    }

    /**
     * Create an AQL analyzer
     */
    public Mono<Map> createAqlAnalyzer(String name, String queryString,
                                        Boolean collapsePositions, Boolean keepNull,
                                        Integer batchSize, Integer memoryLimit,
                                        String returnType, List<String> features) {
        log.info("Creating AQL analyzer: {}", name);
        
        Map<String, Object> properties = new HashMap<>();
        properties.put("queryString", queryString);
        if (collapsePositions != null) properties.put("collapsePositions", collapsePositions);
        if (keepNull != null) properties.put("keepNull", keepNull);
        if (batchSize != null) properties.put("batchSize", batchSize);
        if (memoryLimit != null) properties.put("memoryLimit", memoryLimit);
        if (returnType != null) properties.put("returnType", returnType);

        return createAnalyzer(name, "aql", properties, features);
    }

    /**
     * Create a geo JSON analyzer
     */
    public Mono<Map> createGeoJsonAnalyzer(String name, String type,
                                            Map<String, Object> options,
                                            List<String> features) {
        log.info("Creating geojson analyzer: {}", name);
        
        Map<String, Object> properties = new HashMap<>();
        if (type != null) properties.put("type", type);
        if (options != null) properties.put("options", options);

        return createAnalyzer(name, "geojson", properties, features);
    }

    /**
     * Create a geo point analyzer
     */
    public Mono<Map> createGeoPointAnalyzer(String name, List<String> latitude,
                                             List<String> longitude,
                                             Map<String, Object> options,
                                             List<String> features) {
        log.info("Creating geopoint analyzer: {}", name);
        
        Map<String, Object> properties = new HashMap<>();
        if (latitude != null) properties.put("latitude", latitude);
        if (longitude != null) properties.put("longitude", longitude);
        if (options != null) properties.put("options", options);

        return createAnalyzer(name, "geopoint", properties, features);
    }
}
