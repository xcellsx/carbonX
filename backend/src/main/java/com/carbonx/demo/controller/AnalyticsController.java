package com.carbonx.demo.controller;

import java.util.HashMap; // <-- ADDED
import java.util.List;
import java.util.Map;

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
import com.carbonx.demo.repository.ProductInventoryRepository;
import com.carbonx.demo.repository.ProductRepository; // <-- ADDED
import com.fasterxml.jackson.databind.ObjectMapper; // <-- ADDED

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private ProductInventoryRepository inventoryRepo; // <-- ADDED

    private ObjectMapper objectMapper = new ObjectMapper(); // <-- ADDED

    private static final String JSONRPC_ENDPOINT = "http://localhost:8080/";
    private static final String UUID_REGEX = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    
    // This is the default "ReCiPe 2016 Midpoint (H)" method ID
    private static final String DEFAULT_IMPACT_METHOD_ID = "61966689-76aa-4b3b-94f1-81989199433f";
    
    // Using the "Climate change" ID you provided
    private static final String DEFAULT_IMPACT_CATEGORY_ID = "35ead5f0-fc9d-4afc-9f17-0f2a2fbffbd2";


    /**
     * Fetches the total flows (inputs and outputs) for a given process.
     * This mirrors the 'loadInventory' function in openlcav2.html.
     */
    @GetMapping("/flows") // <-- RENAMED from "/impacts"
    public ResponseEntity<?> getProcessFlows( // <-- Renamed method
            @RequestParam String processIdentifier,
            @RequestParam Double weight) {

        String processUuid = resolveProcessIdentifier(processIdentifier);
        if (processUuid == null) {
            return ResponseEntity.badRequest().body("Process not found: " + processIdentifier);
        }

        // We must pass null for the impact method to get flows
        Object result = runCalculation(processUuid, weight, null, "result/total-flows", null);
        
        // Handle if the result itself is an error ResponseEntity
        if (result instanceof ResponseEntity) {
            return (ResponseEntity<?>) result;
        }
        return ResponseEntity.ok(result);
    }

    /**
     * --- ENDPOINT ADDED/FIXED ---
     * Fetches the total impact categories for a given process.
     * This mirrors the 'runCarbon' function in openlcav2.html.
     */
    @GetMapping("/impacts")
    public ResponseEntity<?> getProcessImpacts(
            @RequestParam String processIdentifier,
            @RequestParam Double weight) {

        String processUuid = resolveProcessIdentifier(processIdentifier);
        if (processUuid == null) {
            return ResponseEntity.badRequest().body("Process not found: " + processIdentifier);
        }

        // We must pass the impact method ID to get impacts
        Object result = runCalculation(processUuid, weight, DEFAULT_IMPACT_METHOD_ID, "result/total-impacts", null);
        
        // Handle if the result itself is an error ResponseEntity
        if (result instanceof ResponseEntity) {
            return (ResponseEntity<?>) result;
        }
        return ResponseEntity.ok(result);
    }

    /**
     * --- REMOVED ---
     * This logic now lives in NetworkController.java
     */
    // @GetMapping("/product-network") ... (Removed)


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
     * Based on LcaCalculationController.
     *
     * @param processId       The UUID of the process to calculate.
     * @param weight          The amount (e.g., 1.0).
     * @param impactMethodId  The UUID of the impact method (e.g., ReCiPe) or NULL if fetching flows.
     * @param resultMethod    The final JSON-RPC method to call ("result/total-impacts", "result/total-flows", or "result/sankey").
     * @param resultConfig    Optional config map for the final result method (used by "result/sankey").
     * @return The "result" block from the final JSON-RPC call, or a ResponseEntity on error.
     */
    private Object runCalculation(String processId, Double weight, String impactMethodId, String resultMethod, Map<String, Object> resultConfig) {
        RestTemplate restTemplate = new RestTemplate();
        String resultId = null;
        Object finalResult = null; // --- Store result here

        try {
            // === STEP 1: Call "result/calculate" ===
            Map<String, Object> target = new HashMap<>();
            target.put("@type", "Process");
            target.put("@id", processId);

            Map<String, Object> params = new HashMap<>();
            params.put("target", target);
            params.put("amount", weight);

            // Add impact method only if provided (for impacts, not for flows)
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

            // === STEP 3: Get final result (e.g., "result/total-impacts" or "result/total-flows") ===
            payload.clear();
            params.clear();
            params.put("@id", resultId);
            
            // Add config if it exists (for sankey)
            if (resultConfig != null) {
                params.put("config", resultConfig);
            }

            payload.put("jsonrpc", "2.0");
            payload.put("method", resultMethod); // Use the specified result method
            payload.put("params", params);
            payload.put("id", 1);

            request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            body = response.getBody();

            if (body == null || body.get("error") != null) {
                // --- MODIFIED TO BE MORE SPECIFIC ---
                throw new RuntimeException("OpenLCA JSON-RPC [Step 3] error: " + body.get("error"));
            }

            finalResult = body.get("result"); // Store the result
            return finalResult; // Return the entire "result" object

        } catch (Exception e) {
            e.printStackTrace();
            // --- FIX: Return the error as a standard JSON object ---
            // This prevents a 500 server error and sends a meaningful message to the frontend
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "LCA_CALCULATION_FAILED");
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            // === STEP 4: Dispose of the result ===
            if (resultId != null) {
                // --- FIX: Wrap dispose in try-catch ---
                // This ensures that even if dispose fails, the method returns the data
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
                    // Log the error but do not throw, as we already have the result
                    System.err.println("Warning: Failed to dispose of LCA result " + resultId + ": " + e.getMessage());
                }
            }
        }
    }
}

