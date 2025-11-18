package com.carbonx.demo.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.carbonx.demo.model.Product;
import com.carbonx.demo.repository.ProductRepository;

import jakarta.annotation.PostConstruct;

@Service
public class OpenLCAService {

    @Autowired
    private ProductRepository productRepo;
    
    private static final String OPENLCA_RPC_ENDPOINT = "http://localhost:8081/";
    
    // Cache the Impact Method ID so we don't have to look it up 100 times
    private String cachedReCiPeMethodId = null;

    // --- NEW: REAL CALCULATION LOGIC ---
    /**
     * Sends a calculation request to the OpenLCA server via JSON-RPC.
     * This uses the standard OpenLCA IPC protocol to calculate a result,
     * wait for it to be ready, and then fetch the total impacts.
     *
     * @param processId The UUID of the Process to calculate (e.g., Rapeseed).
     * @param amount    The amount (e.g., 1.0 kg).
     * @return          The total impact (kg CO2 eq) for that amount.
     */
    @SuppressWarnings("unchecked")
    public double calculateImpact(String processId, double amount) {
        if (processId == null || processId.isEmpty()) return 0.0;

        try {
            // 1. Get the UUID for "ReCiPe 2016" from the server (or cache)
            String methodId = getReCiPeMethodId();
            
            System.out.println("\n--- STARTING CALCULATION ---");
            System.out.println("Target Process ID: " + processId);
            System.out.println("Amount: " + amount);
            System.out.println("Impact Method ID: " + methodId);

            if (methodId == null) {
                System.err.println("LCA Error: Could not find 'ReCiPe 2016' method on OpenLCA server.");
                return 0.0;
            }

            // 2. Build the Calculation Setup for JSON-RPC (result/calculate)
            Map<String, Object> calculationSetup = new HashMap<>();
            
            // Target: The Process we want to analyze
            Map<String, Object> target = new HashMap<>();
            target.put("@type", "Process");
            target.put("@id", processId);
            
            // Method: The Impact Assessment Method
            Map<String, Object> impactMethod = new HashMap<>();
            impactMethod.put("@id", methodId);
            
            calculationSetup.put("target", target);
            calculationSetup.put("impactMethod", impactMethod);
            calculationSetup.put("amount", amount); // Calculate for THIS specific amount

            // 3. Wrap in JSON-RPC Request: result/calculate
            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "result/calculate");
            payload.put("params", calculationSetup);
            payload.put("id", "calc-" + processId);

            // 4. Send Calculation Request
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            System.out.println("Sending 'result/calculate' to: " + OPENLCA_RPC_ENDPOINT);
            // Use raw Map.class to avoid type inference issues
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = (Map<String, Object>) response.getBody();

            if (body == null || body.get("error") != null) {
                System.err.println("OpenLCA Calculation Error: " + (body != null ? body.get("error") : "Empty Body"));
                return 0.0;
            }
            
            // The result of 'result/calculate' is a State object that contains the result ID ('@id')
            Map<String, Object> resultRef = (Map<String, Object>) body.get("result");
            if (resultRef == null || resultRef.get("@id") == null) {
                System.err.println("Calculation failed to return a result ID.");
                return 0.0;
            }
            String resultId = (String) resultRef.get("@id");
            System.out.println("Calculation initiated. Result ID: " + resultId);

            // 5. Wait for Calculation to be Ready (result/state)
            boolean isReady = false;
            for (int i = 0; i < 60; i++) { // Timeout after ~30 seconds
                Thread.sleep(500); 
                
                Map<String, Object> stateParams = new HashMap<>();
                stateParams.put("@id", resultId);
                
                Map<String, Object> statePayload = new HashMap<>();
                statePayload.put("jsonrpc", "2.0");
                statePayload.put("method", "result/state");
                statePayload.put("params", stateParams);
                statePayload.put("id", "state-" + resultId);

                HttpEntity<Map<String, Object>> stateRequest = new HttpEntity<>(statePayload, headers);
                ResponseEntity<Map> stateResponse = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, stateRequest, Map.class);
                Map<String, Object> stateBody = (Map<String, Object>) stateResponse.getBody();
                
                if (stateBody != null && stateBody.get("result") != null) {
                    Map<String, Object> stateResult = (Map<String, Object>) stateBody.get("result");
                    if (Boolean.TRUE.equals(stateResult.get("isReady"))) {
                        isReady = true;
                        break;
                    }
                }
            }

            if (!isReady) {
                System.err.println("Calculation timed out.");
                return 0.0;
            }

            // 6. Get Total Impacts (result/total-impacts)
            // Now that it's ready, we ask for the values.
            Map<String, Object> impactsParams = new HashMap<>();
            impactsParams.put("@id", resultId);

            Map<String, Object> impactsPayload = new HashMap<>();
            impactsPayload.put("jsonrpc", "2.0");
            impactsPayload.put("method", "result/total-impacts");
            impactsPayload.put("params", impactsParams);
            impactsPayload.put("id", "impacts-" + resultId);

            HttpEntity<Map<String, Object>> impactsRequest = new HttpEntity<>(impactsPayload, headers);
            ResponseEntity<Map> impactsResponse = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, impactsRequest, Map.class);
            Map<String, Object> impactsBody = (Map<String, Object>) impactsResponse.getBody();

            if (impactsBody == null || impactsBody.get("result") == null) {
                 System.err.println("Failed to retrieve total impacts.");
                 return 0.0;
            }

            List<Map<String, Object>> impactResults = (List<Map<String, Object>>) impactsBody.get("result");

            // 7. Clean up (result/dispose) - Good practice to free memory on server
            // We can do this asynchronously or just fire and forget
            Map<String, Object> disposeParams = new HashMap<>();
            disposeParams.put("@id", resultId);
            Map<String, Object> disposePayload = new HashMap<>();
            disposePayload.put("jsonrpc", "2.0");
            disposePayload.put("method", "result/dispose");
            disposePayload.put("params", disposeParams);
            disposePayload.put("id", "dispose-" + resultId);
            restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(disposePayload, headers), Map.class);


            // 8. Find "Climate change" in the results
            for (Map<String, Object> impact : impactResults) {
                // Each item has 'impactCategory' (descriptor) and 'amount' (number) - Note: API calls it 'amount' in this endpoint
                Map<String, Object> category = (Map<String, Object>) impact.get("impactCategory");
                String categoryName = (String) category.get("name");
                
                // Robust check for the category name
                if (categoryName != null && (categoryName.toLowerCase().contains("climate change") || categoryName.toLowerCase().contains("gwp"))) {
                    Object val = impact.get("amount"); // Note: 'amount' not 'value' for result/total-impacts
                    if (val instanceof Number) {
                        double calculatedValue = ((Number) val).doubleValue();
                        
                        System.out.println(">>> FOUND CATEGORY: " + categoryName);
                        System.out.println(">>> CALCULATED IMPACT: " + calculatedValue + " kg CO2 eq");
                        System.out.println("-----------------------------");
                        return calculatedValue;
                    }
                }
            }
            
            System.out.println("Warning: 'Climate change' category not found in results.");

        } catch (Exception e) {
            System.err.println("Error calling OpenLCA calculation: " + e.getMessage());
            e.printStackTrace(); 
        }

        return 0.0;
    }

    /**
     * Helper to find the UUID of the ReCiPe method on the server.
     * Caches the result to avoid repeated lookups.
     */
    @SuppressWarnings("unchecked")
    private String getReCiPeMethodId() {
        if (cachedReCiPeMethodId != null) {
            System.out.println("Using Cached Method ID: " + cachedReCiPeMethodId);
            return cachedReCiPeMethodId;
        }

        try {
            System.out.println("Looking up ReCiPe 2016 method ID from OpenLCA...");
            
            // Ask OpenLCA for ALL Impact Methods
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "ImpactMethod");

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            payload.put("id", "find-method");

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // Use raw Map.class to avoid generics issues
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = (Map<String, Object>) response.getBody();
            
            if (body != null && body.containsKey("result")) {
                List<Map<String, Object>> methods = (List<Map<String, Object>>) body.get("result");
                for (Map<String, Object> m : methods) {
                    String name = (String) m.get("name");
                    // Search for the specific method name
                    // Adjust this string to match EXACTLY what is in your OpenLCA database if needed
                    if (name != null && name.toLowerCase().contains("recipe 2016") && name.toLowerCase().contains("midpoint (h)")) {
                        cachedReCiPeMethodId = (String) m.get("@id");
                        System.out.println("Found OpenLCA Method ID: " + cachedReCiPeMethodId + " (" + name + ")");
                        return cachedReCiPeMethodId;
                    }
                }
            }
            System.err.println("Could not find ReCiPe 2016 method in OpenLCA database.");
        } catch (Exception e) {
            System.err.println("Failed to lookup Impact Method: " + e.getMessage());
        }
        return null;
    }

        @PostConstruct
    public void init() {
        System.out.println("... Attempting to sync processes from OpenLCA on startup ...");
        syncProcessesFromOpenLCA();
    }

    // --- EXISTING SYNC LOGIC (Unchanged) ---
    @SuppressWarnings("unchecked")
    public int syncProcessesFromOpenLCA() {
        RestTemplate restTemplate = new RestTemplate();
        List<Map<String, Object>> processList;

        try {
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "Process");

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            payload.put("id", 1);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // Use raw Map.class to avoid generics issues
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = (Map<String, Object>) response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC error: " + (body != null ? body.get("error") : "Empty body"));
            }

            processList = (List<Map<String, Object>>) body.get("result");

        } catch (RestClientException e) {
            System.err.println("!!! FAILED TO CONNECT TO OPENLCA SERVER !!!");
            return 0;
        } catch (Exception e) {
            System.err.println("!!! FAILED TO PARSE OPENLCA RESPONSE !!!");
             return 0;
        }

        int count = 0;
        if (processList != null) {
            for (Map<String, Object> process : processList) {
                String uuid = (String) process.get("@id"); 
                String name = (String) process.get("name");
                String location = (String) process.get("location");
                
                if (uuid == null || name == null) continue;

                if (productRepo.existsById(uuid)) continue;
                
                Product prod = new Product();
                prod.setOpenLcaProcessId(uuid);
                prod.setName(name);
                prod.setLocation(location);
                
                productRepo.save(prod);
                count++;
            }
        }
        System.out.println("Successfully synced " + count + " new processes from OpenLCA via JSON-RPC.");
        return count;
    }
}