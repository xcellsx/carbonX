package com.carbonx.demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // <-- ADDED

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.carbonx.demo.model.Product;
import com.carbonx.demo.model.ProductInventory;
import com.carbonx.demo.repository.ProductInventoryRepository;
import com.carbonx.demo.repository.ProductRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/network")
public class NetworkController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private ProductInventoryRepository inventoryRepo;

    private ObjectMapper objectMapper = new ObjectMapper();

    private static final String JSONRPC_ENDPOINT = "http://localhost:8080/";
    private static final String UUID_REGEX = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    
    // This is the default "ReCiPe 2016 Midpoint (H)" method ID
    private static final String DEFAULT_IMPACT_METHOD_ID = "61966689-76aa-4b3b-94f1-81989199433f";
    
    // Using the "Climate change" ID you provided
    private static final String DEFAULT_IMPACT_CATEGORY_ID = "35ead5f0-fc9d-4afc-9f17-0f2a2fbffbd2";

    /**
     * Fetches the sankey graph data for all components in a product.
     * --- NOW INCLUDES LOCATION DATA ---
     */
    @GetMapping("/product-network")
    public ResponseEntity<?> getProductNetwork(@RequestParam Long productId) {
        
        // 1. Find Product and parse DPP data
        ProductInventory product = inventoryRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        String dppDataString = product.getDppData();
        List<Map<String, Object>> components;
        try {
            if (dppDataString == null || dppDataString.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>()); // Return empty list if no components
            }
            components = objectMapper.readValue(dppDataString, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to parse DPP data: " + e.getMessage());
        }

        List<Map<String, Object>> responseList = new ArrayList<>();
        List<String> allProcessUuids = new ArrayList<>(); // <-- To fetch locations

        // 2. Loop through each component and get its graph data
        for (Map<String, Object> component : components) {
            String processIdentifier = (String) component.get("processId");
            if (processIdentifier == null) {
                processIdentifier = (String) component.get("process");
            }
            
            Double weight = 0.0;
            if (component.get("weightKg") != null) {
                 weight = ((Number) component.get("weightKg")).doubleValue();
            }

            if (processIdentifier == null || processIdentifier.isEmpty()) {
                continue; // Skip components without a process
            }

            String processUuid = resolveProcessIdentifier(processIdentifier);
            if (processUuid == null) {
                continue; // Skip if process can't be resolved
            }
            
            // Config for the "result/sankey" call
            Map<String, Object> sankeyConfig = new HashMap<>();
            sankeyConfig.put("impactCategory", Map.of(
                "@type", "ImpactCategory",
                "@id", DEFAULT_IMPACT_CATEGORY_ID 
            ));
            sankeyConfig.put("maxNodes", 30); // Max nodes to show

            // We must pass the impact method ID to get the sankey graph
            Object result = runCalculation(processUuid, weight, DEFAULT_IMPACT_METHOD_ID, "result/sankey", sankeyConfig);

            // --- ADDED: Collect node UUIDs for location fetching ---
            if (result instanceof Map) {
                try {
                    Map<String, Object> graphData = (Map<String, Object>) result;
                    List<Map<String, Object>> nodes = (List<Map<String, Object>>) graphData.get("nodes");
                    if (nodes != null) {
                        for (Map<String, Object> node : nodes) {
                            String providerId = (String) ((Map<String, Object>) ((Map<String, Object>) node.get("techFlow")).get("provider")).get("@id");
                            if (providerId != null) {
                                allProcessUuids.add(providerId);
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Warning: Could not parse nodes for location fetching.");
                }
            }
            // --------------------------------------------------------

            // Add the result to our response list
            Map<String, Object> componentResult = new HashMap<>();
            componentResult.put("componentName", component.get("component"));
            componentResult.put("graphData", result);
            responseList.add(componentResult);
        }
        
        // --- ADDED: Fetch and attach all locations ---
        Map<String, String> locationMap = getLocationsForProcesses(allProcessUuids.stream().distinct().collect(Collectors.toList()));
        Map<String, Object> finalResponse = new HashMap<>();
        finalResponse.put("componentGraphs", responseList);
        finalResponse.put("locations", locationMap);
        // ----------------------------------------------
        
        return ResponseEntity.ok(finalResponse); // <-- Return the new combined object
    }
    
    /**
     * --- ADDED: Helper to fetch locations ---
     * Helper to fetch descriptors and return a Map of [processId, locationCode]
     */
    private Map<String, String> getLocationsForProcesses(List<String> processIds) {
        if (processIds == null || processIds.isEmpty()) {
            return new HashMap<>();
        }
        
        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> locationMap = new HashMap<>();

        Map<String, Object> params = new HashMap<>();
        params.put("@type", "Process");
        params.put("ids", processIds); // Pass the list of IDs

        Map<String, Object> payload = new HashMap<>();
        payload.put("jsonrpc", "2.0");
        payload.put("method", "data/get/descriptors");
        payload.put("params", params);
        payload.put("id", 1);
        
        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            ResponseEntity<Map> response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.get("result") != null) {
                List<Map<String, Object>> descriptors = (List<Map<String, Object>>) body.get("result");
                for (Map<String, Object> desc : descriptors) {
                    String id = (String) desc.get("@id");
                    String location = (String) desc.get("location");
                    if (id != null && location != null) {
                        locationMap.put(id, location);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch process descriptors for locations: " + e.getMessage());
        }
        return locationMap;
    }


    /**
     * Helper to resolve a process name or UUID to a UUID.
     */
    private String resolveProcessIdentifier(String processIdentifier) {
        if (processIdentifier.matches(UUID_REGEX)) {
            return processIdentifier; // It's already a UUID
        }
        
        // It's a name, look it up
        List<Product> products = productRepo.findByNameContainingIgnoreCase(processIdentifier);
        if (products.isEmpty()) {
            return null;
        }
        
        // Try to find an exact match first
        for (Product p : products) {
            if (p.getName().equalsIgnoreCase(processIdentifier)) {
                return p.getOpenLcaProcessId();
            }
        }
        // If no exact match, return the first partial match
        return products.get(0).getOpenLcaProcessId();
    }


    /**
     * Generic multi-step JSON-RPC calculation runner.
     */
    private Object runCalculation(String processId, Double weight, String impactMethodId, String resultMethod, Map<String, Object> resultConfig) {
        RestTemplate restTemplate = new RestTemplate();
        String resultId = null;
        Object finalResult = null;

        try {
            // === STEP 1: Call "result/calculate" ===
            Map<String, Object> target = new HashMap<>();
            target.put("@type", "Process");
            target.put("@id", processId);

            Map<String, Object> params = new HashMap<>();
            params.put("target", target);
            params.put("amount", weight);

            if (impactMethodId != null) {
                Map<String, Object> method = new HashMap<>();
                method.put("@type", "ImpactMethod");
                method.put("@id", impactMethodId);
                params.put("impactMethod", method);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "result/calculate");
            payload.put("params", params);
            payload.put("id", 1);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            ResponseEntity<Map> response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC [Step 1] error: " + body.get("error"));
            }
            
            Map<String, Object> rpcResult = (Map<String, Object>) body.get("result");
            resultId = (String) rpcResult.get("@id");

            // === STEP 2: Poll "result/state" ===
            boolean isReady = false;
            for (int i = 0; i < 20; i++) {
                payload.clear();
                params.clear();
                params.put("@id", resultId);
                payload.put("jsonrpc", "2.0");
                payload.put("method", "result/state");
                payload.put("params", params);
                payload.put("id", 1);
                
                request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
                response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
                body = response.getBody();
                
                if (body != null && body.get("result") != null) {
                    rpcResult = (Map<String, Object>) body.get("result");
                    if (Boolean.TRUE.equals(rpcResult.get("isReady"))) {
                        isReady = true;
                        break; 
                    }
                }
                Thread.sleep(500); 
            }

            if (!isReady) {
                throw new RuntimeException("LCA calculation timed out.");
            }

            // === STEP 3: Get final result ===
            payload.clear();
            params.clear();
            params.put("@id", resultId);
            
            if (resultConfig != null) {
                params.put("config", resultConfig);
            }

            payload.put("jsonrpc", "2.0");
            payload.put("method", resultMethod);
            payload.put("params", params);
            payload.put("id", 1);

            request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            body = response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC [Step 3] error: " + body.get("error"));
            }

            finalResult = body.get("result");
            return finalResult;

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "LCA_CALCULATION_FAILED");
            errorResponse.put("message", e.getMessage());
            // Return the error map directly
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            // === STEP 4: Dispose of the result ===
            if (resultId != null) {
                try {
                    Map<String, Object> params = new HashMap<>();
                    params.put("@id", resultId);
                    
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("jsonrpc", "2.0");
                    payload.put("method", "result/dispose");
                    payload.put("params", params);
                    payload.put("id", 1);
                    
                    HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
                    restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
                } catch (Exception e) {
                    System.err.println("Warning: Failed to dispose of LCA result " + resultId + ": " + e.getMessage());
                }
            }
        }
    }
}

