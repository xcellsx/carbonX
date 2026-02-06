package com.ecapybara.CarbonX.controller.arango;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.ecapybara.CarbonX.service.arango.ArangoAnalyzerService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * REST Controller for ArangoDB Analyzer operations.
 * Base path: /api/arango/analyzers
 */
@Slf4j
@RestController
@RequestMapping("/api/arango/analyzers")
public class ArangoAnalyzerController {

    @Autowired
    private ArangoAnalyzerService analyzerService;

    // ==================== Analyzer CRUD ====================

    @GetMapping
    public Mono<Map> listAnalyzers() {
        return analyzerService.listAnalyzers();
    }

    @GetMapping("/{analyzerName}")
    public Mono<Map> getAnalyzer(@PathVariable String analyzerName) {
        return analyzerService.getAnalyzer(analyzerName);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String type = (String) request.get("type");
        Map<String, Object> properties = (Map<String, Object>) request.get("properties");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createAnalyzer(name, type, properties, features);
    }

    @DeleteMapping("/{analyzerName}")
    public Mono<Map> deleteAnalyzer(
            @PathVariable String analyzerName,
            @RequestParam(required = false) Boolean force) {
        return analyzerService.deleteAnalyzer(analyzerName, force);
    }

    // ==================== Common Analyzer Types ====================

    @PostMapping("/identity")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createIdentityAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<String> features = (List<String>) request.get("features");
        return analyzerService.createIdentityAnalyzer(name, features);
    }

    @PostMapping("/text")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createTextAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String locale = (String) request.get("locale");
        Boolean accent = (Boolean) request.get("accent");
        String caseHandling = (String) request.get("case");
        String stemming = (String) request.get("stemming");
        List<String> stopwords = (List<String>) request.get("stopwords");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createTextAnalyzer(name, locale, accent, caseHandling, 
            stemming, stopwords, features);
    }

    @PostMapping("/delimiter")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createDelimiterAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String delimiter = (String) request.get("delimiter");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createDelimiterAnalyzer(name, delimiter, features);
    }

    @PostMapping("/stem")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createStemAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String locale = (String) request.get("locale");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createStemAnalyzer(name, locale, features);
    }

    @PostMapping("/norm")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createNormAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String locale = (String) request.get("locale");
        Boolean accent = (Boolean) request.get("accent");
        String caseHandling = (String) request.get("case");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createNormAnalyzer(name, locale, accent, caseHandling, features);
    }

    @PostMapping("/ngram")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createNgramAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        Integer min = (Integer) request.get("min");
        Integer max = (Integer) request.get("max");
        Boolean preserveOriginal = (Boolean) request.get("preserveOriginal");
        String startMarker = (String) request.get("startMarker");
        String endMarker = (String) request.get("endMarker");
        String streamType = (String) request.get("streamType");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createNgramAnalyzer(name, min, max, preserveOriginal, 
            startMarker, endMarker, streamType, features);
    }

    @PostMapping("/pipeline")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createPipelineAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<Map<String, Object>> pipeline = (List<Map<String, Object>>) request.get("pipeline");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createPipelineAnalyzer(name, pipeline, features);
    }

    @PostMapping("/aql")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createAqlAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String queryString = (String) request.get("queryString");
        Boolean collapsePositions = (Boolean) request.get("collapsePositions");
        Boolean keepNull = (Boolean) request.get("keepNull");
        Integer batchSize = (Integer) request.get("batchSize");
        Integer memoryLimit = (Integer) request.get("memoryLimit");
        String returnType = (String) request.get("returnType");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createAqlAnalyzer(name, queryString, collapsePositions, 
            keepNull, batchSize, memoryLimit, returnType, features);
    }

    @PostMapping("/geojson")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createGeoJsonAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String type = (String) request.get("type");
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createGeoJsonAnalyzer(name, type, options, features);
    }

    @PostMapping("/geopoint")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Map> createGeoPointAnalyzer(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        List<String> latitude = (List<String>) request.get("latitude");
        List<String> longitude = (List<String>) request.get("longitude");
        Map<String, Object> options = (Map<String, Object>) request.get("options");
        List<String> features = (List<String>) request.get("features");
        
        return analyzerService.createGeoPointAnalyzer(name, latitude, longitude, options, features);
    }
}
