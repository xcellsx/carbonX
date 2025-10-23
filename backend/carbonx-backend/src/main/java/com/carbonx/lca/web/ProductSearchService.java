package com.carbonx.lca.service;

import com.carbonx.lca.domain.Flow;
import com.carbonx.lca.domain.Impact;
import com.carbonx.lca.domain.Product;
import com.carbonx.lca.repo.FlowRepository;
import com.carbonx.lca.repo.ImpactRepository;
import com.carbonx.lca.repo.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductSearchService {

    private final ProductRepository productRepository;
    private final FlowRepository flowRepository; // NEW: Inject FlowRepository
    private final ImpactRepository impactRepository; // NEW: Inject ImpactRepository
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper; // NEW: For parsing JSON

    @Value("${olca.ipcBaseUrl}")
    private String olcaUrl;

    // Updated constructor to accept the new repositories
    public ProductSearchService(ProductRepository productRepository, FlowRepository flowRepository, ImpactRepository impactRepository) {
        this.productRepository = productRepository;
        this.flowRepository = flowRepository;
        this.impactRepository = impactRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper(); // Initialize the JSON parser
    }

    @Transactional // NEW: Ensures the whole method is one database transaction
    public Map<String, Object> searchAndSave(String productName) {
        // Step 1: Find the product in our local database
        Product product = productRepository.findByNameContainingIgnoreCase(productName).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in local database: " + productName));

        // Step 2: Make the call to the openLCA server (same as before)
        String olcaRequestBody = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"search\",\"params\":{\"query\":\"" + productName + "\"}}";
        String jsonResponse = restTemplate.postForObject(olcaUrl, olcaRequestBody, String.class);

        // Step 3: NEW - Parse the response and save the data
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            
            // Assuming the structure from your previous files, this is a simplified parsing logic.
            // You might need to adjust the paths ("olca", "inventory", "fullImpacts") based on the actual JSON structure.
            JsonNode olcaData = rootNode.path("olca");
            JsonNode inventory = olcaData.path("inventory");
            JsonNode impacts = olcaData.path("fullImpacts");

            if (inventory.isArray()) {
                for (JsonNode flowNode : inventory) {
                    Flow flow = new Flow();
                    flow.setProduct(product);
                    // Simplified: setting both input and output from the same node for this example
                    flow.setInputId(flowNode.path("enviFlow").path("flow").path("name").asText());
                    flow.setInputUnit(flowNode.path("enviFlow").path("flow").path("refUnit").asText());
                    flow.setInputValue(BigDecimal.valueOf(flowNode.path("amount").asDouble()));
                    
                    flow.setOutputId(product.getName()); // Example output
                    flow.setOutputUnit("unit");
                    flow.setOutputValue(BigDecimal.ONE);

                    flowRepository.save(flow); // Save the new Flow object to the database

                     // Now, parse and save the impacts for this flow
                    if (impacts.isArray()) {
                        for (JsonNode impactNode : impacts) {
                            Impact impact = new Impact();
                            impact.setFlow(flow);
                            impact.setMethodId("RECIPE 2016 Midpoint (H)"); // Example method
                            impact.setImpactId(impactNode.path("impactCategory").path("name").asText());
                            impact.setImpactIdUnit(impactNode.path("impactCategory").path("refUnit").asText());
                            impact.setImpactValue(BigDecimal.valueOf(impactNode.path("amount").asDouble()));
                            impactRepository.save(impact); // Save the new Impact object to the database
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse and save LCA data", e);
        }

        // Step 4: Return a success response
        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "LCA data fetched and saved for product: " + productName);
        return result;
    }
     // Keep the old search method for now, but update the LcaController to use the new searchAndSave
    public Map<String, Object> search(String query) {
        // 1. Search your local database
        List<Product> localResults = productRepository.findByNameContainingIgnoreCase(query);

        // 2. Search openLCA via JSON-RPC
        String olcaRequestBody = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"search\",\"params\":{\"query\":\"" + query + "\"}}";
        Object olcaResults = restTemplate.postForObject(olcaUrl, olcaRequestBody, Object.class);

        // 3. Combine results
        Map<String, Object> combinedResults = new HashMap<>();
        combinedResults.put("local", localResults);
        combinedResults.put("olca", olcaResults);

        return combinedResults;
    }
}