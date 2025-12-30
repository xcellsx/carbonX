package com.ecapybara.carbonx.service;

import java.util.Collections;
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

import com.ecapybara.carbonx.model.Product;
import com.ecapybara.carbonx.repository.ProductRepository;

import jakarta.annotation.PostConstruct;

@Service
public class LCAService {

    @Autowired
    private ProductRepository productRepo;
    
    private static final String OPENLCA_RPC_ENDPOINT = "http://localhost:8081/";
    private static final String UUID_REGEX = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    
    private String cachedReCiPeMethodId = null;
    
    // Default to Climate Change (We will rely on you updating this after you get the logs)
    public static final String DEFAULT_CATEGORY_ID = "35ead5f0-fc9d-4afc-9f17-0f2a2fbffbd2";

    // =================================================================
    // 1. PUBLIC API: NETWORK / SANKEY
    // =================================================================

    public Map<String, Object> getSankeyGraph(String processId, double amount, String impactCategoryId) {
        String methodId = getReCiPeMethodId();
        if (methodId == null) {
            throw new RuntimeException("Impact Method (ReCiPe) not found on OpenLCA server.");
        }

        String categoryId = (impactCategoryId != null && !impactCategoryId.isEmpty()) 
                ? impactCategoryId 
                : DEFAULT_CATEGORY_ID;

        Map<String, Object> sankeyConfig = new HashMap<>();
        sankeyConfig.put("impactCategory", Map.of(
            "@type", "ImpactCategory",
            "@id", categoryId 
        ));
        sankeyConfig.put("maxNodes", 30); 

        return runRpcCalculation(processId, amount, methodId, "result/sankey", sankeyConfig);
    }

    // =================================================================
    // 2. PUBLIC API: ANALYTICS
    // =================================================================

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getProcessFlows(String processId, double amount) {
        Object result = runRpcCalculation(processId, amount, null, "result/total-flows", null);
        if (result instanceof List) return (List<Map<String, Object>>) result;
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getImpactResults(String processId, double amount) {
        String methodId = getReCiPeMethodId();
        if (methodId == null) throw new RuntimeException("Impact Method not found");
        
        Object result = runRpcCalculation(processId, amount, methodId, "result/total-impacts", null);
        if (result instanceof List) return (List<Map<String, Object>>) result;
        return Collections.emptyList();
    }

    // =================================================================
    // 3. PUBLIC API: INVENTORY
    // =================================================================

    public double calculateImpact(String processId, double amount) {
        try {
            List<Map<String, Object>> results = getImpactResults(processId, amount);
            for (Map<String, Object> impact : results) {
                Map<String, Object> category = (Map<String, Object>) impact.get("impactCategory");
                String categoryName = (String) category.get("name");
                if (categoryName != null && (categoryName.toLowerCase().contains("climate change") || categoryName.toLowerCase().contains("gwp"))) {
                    Object val = impact.get("amount");
                    if (val instanceof Number) return ((Number) val).doubleValue();
                }
            }
        } catch (Exception e) {
            System.err.println("Error in calculateImpact: " + e.getMessage());
        }
        return 0.0;
    }

    // =================================================================
    // 4. SHARED HELPERS
    // =================================================================
     
    // to check whether product has process ID
    public String resolveProcessIdentifier(String identifier) {
        if (identifier == null) return null;
        if (identifier.matches(UUID_REGEX)) return identifier;
        
        List<Product> products = productRepo.findByNameContainingIgnoreCase(identifier);
        if (products.isEmpty()) return null;
        
        for (Product p : products) {
            if (p.getName().equalsIgnoreCase(identifier)) return p.getOpenLcaProcessId();
        }
        return products.get(0).getOpenLcaProcessId();
    }

    private HttpHeaders getJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    // =================================================================
    // 5. CORE JSON-RPC LOGIC
    // =================================================================

    @SuppressWarnings("unchecked")
    private <T> T runRpcCalculation(String processId, double amount, String impactMethodId, String resultMethod, Map<String, Object> resultConfig) {
        RestTemplate restTemplate = new RestTemplate();
        String resultId = null;

        try {
            // 1. Calculate
            Map<String, Object> params = new HashMap<>();
            params.put("target", Map.of("@type", "Process", "@id", processId));
            params.put("amount", amount);
            if (impactMethodId != null) {
                params.put("impactMethod", Map.of("@type", "ImpactMethod", "@id", impactMethodId));
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "result/calculate");
            payload.put("params", params);
            payload.put("id", 1);

            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
            Map<String, Object> rpcResult = (Map<String, Object>) response.getBody().get("result");
            
            if (rpcResult == null || rpcResult.get("@id") == null) throw new RuntimeException("Calculation failed");
            resultId = (String) rpcResult.get("@id");

            // 2. Wait
            boolean isReady = false;
            for (int i = 0; i < 40; i++) {
                payload.clear(); params.clear();
                params.put("@id", resultId);
                payload.put("jsonrpc", "2.0");
                payload.put("method", "result/state");
                payload.put("params", params);
                
                response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
                rpcResult = (Map<String, Object>) response.getBody().get("result");
                if (Boolean.TRUE.equals(rpcResult.get("isReady"))) {
                    isReady = true;
                    break;
                }
                Thread.sleep(500);
            }
            if (!isReady) throw new RuntimeException("Timeout");

            // 3. Fetch Result
            payload.clear(); params.clear();
            params.put("@id", resultId);
            if (resultConfig != null) params.put("config", resultConfig);
            
            payload.put("jsonrpc", "2.0");
            payload.put("method", resultMethod);
            payload.put("params", params);

            response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
            
            if (response.getBody() == null || response.getBody().get("result") == null) return null;
            return (T) response.getBody().get("result");

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("OpenLCA RPC Failed: " + e.getMessage());
        } finally {
            if (resultId != null) {
                try {
                    Map<String, Object> params = new HashMap<>();
                    params.put("@id", resultId);
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("jsonrpc", "2.0");
                    payload.put("method", "result/dispose");
                    payload.put("params", params);
                    restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
                } catch (Exception ignored) {}
            }
        }
    }

    // =================================================================
    // 6. INITIALIZATION & DEBUGGING (DIRECT SEARCH)
    // =================================================================

    @PostConstruct
    public void init() {
        syncProcessesFromOpenLCA();
        printAvailableImpactCategories(); // Runs on startup
    }

    @SuppressWarnings("unchecked")
    public void printAvailableImpactCategories() {
        System.out.println("\n==================================================");
        System.out.println("    SEARCHING FOR RELEVANT IMPACT CATEGORIES      ");
        System.out.println("==================================================");
        
        try {
            // Ask OpenLCA for ALL Impact Categories directly
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "ImpactCategory");

            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            payload.put("id", "get-all-cats");

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
            
            List<Map<String, Object>> categories = (List<Map<String, Object>>) response.getBody().get("result");
            
            if (categories != null) {
                for (Map<String, Object> cat : categories) {
                    String name = (String) cat.get("name");
                    String id = (String) cat.get("@id");
                    String refUnit = (String) cat.get("refUnit");

                    if (name == null) continue;
                    String lower = name.toLowerCase();

                    // We only print the ones that match your 5 requested types
                    // AND (crucially) belong to ReCiPe if possible. 
                    // Since we can't easily filter by method in descriptors, 
                    // we'll look for the name pattern "ReCiPe" if it exists in the category name, 
                    // or just match the impact type generally.

                    boolean isMatch = false;
                    
                    if (lower.contains("climate change")) isMatch = true;
                    else if (lower.contains("land use")) isMatch = true;
                    else if (lower.contains("ozone depletion")) isMatch = true;
                    else if (lower.contains("particulate matter")) isMatch = true;
                    else if (lower.contains("photochemical")) isMatch = true;

                    if (isMatch) {
                        System.out.println(">>> FOUND: " + name);
                        System.out.println("    UUID: " + id);
                        System.out.println("    Unit: " + refUnit);
                        System.out.println("--------------------------------------------------");
                    }
                }
            } else {
                System.out.println("No categories returned from OpenLCA.");
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch categories: " + e.getMessage());
        }
        System.out.println("==================================================\n");
    }

    @SuppressWarnings("unchecked")
    public int syncProcessesFromOpenLCA() {
        RestTemplate restTemplate = new RestTemplate();
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "Process");
            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            payload.put("id", 1);
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
            List<Map<String, Object>> processList = (List<Map<String, Object>>) response.getBody().get("result");
            if (processList != null) {
                int count = 0;
                for (Map<String, Object> process : processList) {
                    String uuid = (String) process.get("@id"); 
                    String name = (String) process.get("name");
                    String location = (String) process.get("location");
                    if (uuid == null || name == null) continue;
                    if (!productRepo.existsById(uuid)) {
                        Product prod = new Product();
                        prod.setOpenLcaProcessId(uuid);
                        prod.setName(name);
                        prod.setLocation(location);
                        productRepo.save(prod);
                        count++;
                    }
                }
                System.out.println("Synced " + count + " new processes.");
                return count;
            }
        } catch (Exception e) { return 0; }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private String getReCiPeMethodId() {
        if (cachedReCiPeMethodId != null) return cachedReCiPeMethodId;
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("@type", "ImpactMethod");
            Map<String, Object> payload = new HashMap<>();
            payload.put("jsonrpc", "2.0");
            payload.put("method", "data/get/descriptors");
            payload.put("params", params);
            ResponseEntity<Map> response = new RestTemplate().postForEntity(OPENLCA_RPC_ENDPOINT, new HttpEntity<>(payload, getJsonHeaders()), Map.class);
            List<Map<String, Object>> methods = (List<Map<String, Object>>) response.getBody().get("result");
            for (Map<String, Object> m : methods) {
                String name = (String) m.get("name");
                if (name != null && name.toLowerCase().contains("recipe 2016") && name.toLowerCase().contains("midpoint (h)")) {
                    cachedReCiPeMethodId = (String) m.get("@id");
                    return cachedReCiPeMethodId;
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
}
