package com.carbonx.demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.carbonx.demo.dto.LcaCalcRequest;
import com.carbonx.demo.dto.LcaResult;
import com.carbonx.demo.model.Product; // <-- IMPORTED
import com.carbonx.demo.model.ProductInventory;
import com.carbonx.demo.repository.ProductInventoryRepository;
import com.carbonx.demo.repository.ProductRepository; // <-- IMPORTED

@RestController
@RequestMapping("/api/openlca")
public class LcaCalculationController {

    @Autowired
    private ProductInventoryRepository inventoryRepo;

    @Autowired
    private ProductRepository productRepo; // <-- REPOSITORY ADDED

    // A simple regex to check if a string looks like a UUID
    private static final String UUID_REGEX = 
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    // Main endpoint: returns a per-component breakdown, stores total if needed
    @PostMapping("/calculate")
    public LcaResult calculateAndStoreLca(@RequestBody LcaCalcRequest req) {
        List<LcaResult.ComponentResult> breakdown = new ArrayList<>();
        double totalLca = 0.0;

        for (LcaCalcRequest.Component c : req.getComponents()) {
            
            String processIdentifier = c.getProcessId(); // This is the string from the frontend
            String actualUuid = null;

            if (processIdentifier == null || processIdentifier.trim().isEmpty()) {
                 throw new RuntimeException("Process name/ID cannot be empty.");
            }

            // Check if the identifier from the frontend is already a UUID
            if (processIdentifier.matches(UUID_REGEX)) {
                System.out.println("Received a UUID, using directly: " + processIdentifier);
                actualUuid = processIdentifier;
            } else {
                // If not a UUID, treat it as a name and look it up
                System.out.println("Received a name, looking up: " + processIdentifier);
                List<Product> products = productRepo.findByNameContainingIgnoreCase(processIdentifier);

                if (products.isEmpty()) {
                    System.err.println("Could not find process UUID for name: " + processIdentifier);
                    throw new RuntimeException("Invalid process name: " + processIdentifier + ". Not found in Product table.");
                } else {
                    // Try to find an exact match first
                    for (Product p : products) {
                        if (p.getName().equalsIgnoreCase(processIdentifier)) {
                            actualUuid = p.getOpenLcaProcessId();
                            break;
                        }
                    }
                    // If no exact match, take the first result
                    if (actualUuid == null) {
                        System.err.println("Ambiguous process name: " + processIdentifier + ". Found " + products.size() + " matches. Taking the first.");
                        actualUuid = products.get(0).getOpenLcaProcessId();
                    }
                }
            }

            // Now we have the correct UUID (actualUuid)
            double lcaValue = callOpenLcaApi(actualUuid, c.getWeight()); // Pass the UUID
            breakdown.add(new LcaResult.ComponentResult(
                c.getProcessId(), // Keep the original identifier from the request
                c.getWeight(),
                lcaValue,
                "kg CO₂-eq",
                null // Process name if needed
            ));
            totalLca += lcaValue;
        }

        // Save total LCA to product inventory (optional, for summary)
        if (req.getInventoryId() != null) {
            ProductInventory inv = inventoryRepo.findById(req.getInventoryId()).orElse(null);
            if (inv != null) {
                inv.setLcaResult(totalLca);
                inventoryRepo.save(inv);
            }
        }

        // Return a detailed breakdown for the frontend
        return new LcaResult(breakdown);
    }

    // Calls the OpenLCA server using the multi-step JSON-RPC flow
    private double callOpenLcaApi(String processId, Double weight) {
        String JSONRPC_ENDPOINT = "http://localhost:8081/";
        RestTemplate restTemplate = new RestTemplate();
        String resultId = null;

        try {
            // === STEP 1: Call "result/calculate" ===
            Map<String, Object> target = new HashMap<>();
            target.put("@type", "Process");
            target.put("@id", processId); 

            Map<String, Object> method = new HashMap<>();
            method.put("@type", "ImpactMethod");
            method.put("@id", "61966689-76aa-4b3b-94f1-81989199433f"); // This is the METHOD ID

            Map<String, Object> params = new HashMap<>();
            params.put("target", target);
            params.put("impactMethod", method);
            params.put("amount", weight);

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "result/calculate");
            payload.put("params", params);
            payload.put("id", 1);

            System.out.println("JSON-RPC [Step 1: calculate] payload: " + payload);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            ResponseEntity<Map> response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC [Step 1] error: " + body);
            }
            
            Map<String, Object> rpcResult = (Map<String, Object>) body.get("result");
            resultId = (String) rpcResult.get("@id"); 
            System.out.println("JSON-RPC [Step 1] success. Result ID: " + resultId);


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
                        System.out.println("JSON-RPC [Step 2: state] calculation is ready.");
                        break; 
                    }
                }
                Thread.sleep(500); 
            }

            if (!isReady) {
                throw new RuntimeException("LCA calculation timed out.");
            }

            // === STEP 3: Get "result/total-impacts" ===
            payload.clear();
            params.clear();
            params.put("@id", resultId);

            payload.put("jsonrpc", "2.0");
            payload.put("method", "result/total-impacts");
            payload.put("params", params);
            payload.put("id", 1);

            request = new HttpEntity<>(payload, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
            response = restTemplate.postForEntity(JSONRPC_ENDPOINT, request, Map.class);
            body = response.getBody();

            if (body == null || body.get("error") != null) {
                throw new RuntimeException("OpenLCA JSON-RPC [Step 3] error: " + body);
            }

            List<Map<String, Object>> impacts = (List<Map<String, Object>>) body.get("result");
            if (impacts == null || impacts.isEmpty()) {
                throw new RuntimeException("No impact results array in JSON-RPC response!");
            }

            // --- START OF FIX ---
            // Loop through the results to find "Climate change"
            Map<String, Object> climateChangeImpact = null;
            for (Map<String, Object> impact : impacts) {
                Map<String, Object> category = (Map<String, Object>) impact.get("impactCategory");
                if (category != null && category.get("name") != null) {
                    String categoryName = (String) category.get("name");
                    // This is the specific category we want
                    if (categoryName.equalsIgnoreCase("Climate change")) {
                        climateChangeImpact = impact;
                        System.out.println("Found 'Climate change' impact category.");
                        break;
                    }
                }
            }

            if (climateChangeImpact == null) {
                // If we can't find it, throw an error
                throw new RuntimeException("Could not find 'Climate change' in impact results!");
            }

            // Return the "amount" from the "Climate change" impact
            return Double.parseDouble(String.valueOf(climateChangeImpact.get("amount")));
            // --- END OF FIX ---

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("LCA JSON-RPC call failed: " + e.getMessage());
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
                    System.out.println("JSON-RPC [Step 4: dispose] cleaned up result: " + resultId);
                } catch (Exception e) {
                    System.err.println("Failed to dispose of LCA result: " + e.getMessage());
                }
            }
        }
    }
}