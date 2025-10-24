package com.carbonx.lca.service;

import com.carbonx.lca.domain.Flow;
import com.carbonx.lca.domain.Impact;
import com.carbonx.lca.domain.Product;
import com.carbonx.lca.repo.FlowRepository;
import com.carbonx.lca.repo.ImpactRepository;
import com.carbonx.lca.repo.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;


@Service
public class ProductSearchService {

    private static final Logger log = LoggerFactory.getLogger(ProductSearchService.class);

    private final ProductRepository productRepository;
    private final FlowRepository flowRepository;
    private final ImpactRepository impactRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AtomicLong jsonRpcRequestId = new AtomicLong(1);

    @Value("${olca.ipcBaseUrl}")
    private String olcaUrl;

    private String impactMethodId;
    private String impactMethodName;
    private String climateChangeCategoryId;
    private String climateChangeCategoryName = "Climate change";
    private String climateChangeCategoryUnit;

    public ProductSearchService(ProductRepository productRepository, FlowRepository flowRepository, ImpactRepository impactRepository) {
        this.productRepository = productRepository;
        this.flowRepository = flowRepository;
        this.impactRepository = impactRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    private void initializeLcaParameters() {
        // ... (initialization logic remains unchanged - already finds unit) ...
        log.info("Attempting to initialize LCA parameters from openLCA at {}...", olcaUrl);
        try {
             try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                Map<String, Object> pingBody = Map.of("jsonrpc", "2.0", "id", jsonRpcRequestId.getAndIncrement(), "method", "ping");
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(pingBody, headers);
                restTemplate.exchange(olcaUrl, HttpMethod.POST, entity, String.class);
                 log.info("Successfully pinged openLCA IPC server.");
            } catch (Exception connErr) {
                log.warn("Could not connect to openLCA IPC server at {} during startup. On-demand calculations will likely fail until it's available. Error: {}", olcaUrl, connErr.getMessage());
                return;
            }

            String methodSearchName = "recipe 2016 v1.03";
            String methodSearchVariant = "midpoint (h)";
            JsonNode methods = olcaRequest("data/get/descriptors", Map.of("@type", "ImpactMethod"));
            JsonNode foundMethod = null;
            if (methods != null && methods.isArray()) {
                for (JsonNode method : methods) {
                    String nameLower = method.path("name").asText("").toLowerCase();
                    if (nameLower.contains(methodSearchName) && nameLower.contains(methodSearchVariant)) {
                        foundMethod = method;
                        break;
                    }
                }
            }
            if (foundMethod == null) {
                log.warn("Required Impact Method '{} {}' not found in openLCA. Check database.", methodSearchName, methodSearchVariant);
                return;
            }
            this.impactMethodId = foundMethod.path("@id").asText();
            this.impactMethodName = foundMethod.path("name").asText();
            log.info("Found Impact Method: ID={}, Name={}", impactMethodId, impactMethodName);

            // Use the stored constant for climate change category name search
            JsonNode methodDetails = olcaRequest("data/get", Map.of("@type", "ImpactMethod", "@id", this.impactMethodId));
            JsonNode categories = methodDetails != null ? methodDetails.path("impactCategories") : null;
            JsonNode foundCategory = null;
            if (categories != null && categories.isArray()) {
                 for (JsonNode category : categories) {
                     String nameLower = category.path("name").asText("").toLowerCase();
                     // Use the constant here
                     if (nameLower.contains(climateChangeCategoryName.toLowerCase())) {
                         foundCategory = category;
                         break;
                     }
                 }
            }
            if (foundCategory == null) {
                 log.warn("Required Impact Category '{}' not found within method '{}'.", climateChangeCategoryName, this.impactMethodName);
                 return;
            }
            this.climateChangeCategoryId = foundCategory.path("@id").asText();
            // Store the exact name and unit found
            this.climateChangeCategoryName = foundCategory.path("name").asText(climateChangeCategoryName); // Update with exact name if found
            this.climateChangeCategoryUnit = foundCategory.path("refUnit").asText(); // Store the unit
            log.info("Found Impact Category: ID={}, Name='{}', Unit='{}'", climateChangeCategoryId, this.climateChangeCategoryName, this.climateChangeCategoryUnit);
            log.info("LCA parameters initialized successfully.");

        } catch (Exception e) {
             log.error("Could not initialize required LCA parameters from openLCA during startup. On-demand calculations might fail later. Error: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Object> syncAllProductsFromOpenLCA() {
        // ... (sync logic remains unchanged) ...
        log.info("Starting sync of product names from openLCA...");
        JsonNode processDescriptors = null;
        try {
             processDescriptors = olcaRequest("data/get/descriptors", Map.of("@type", "Process"));
        } catch (Exception e) {
             log.error("Failed to connect to openLCA to get process descriptors during sync: {}", e.getMessage());
             return Map.of(
                 "status", "error",
                 "message", "Could not connect to openLCA for sync. Is it running?",
                 "error", e.getMessage()
             );
        }

        AtomicInteger productsAdded = new AtomicInteger(0);
        int totalProcesses = 0;

        if (processDescriptors != null && processDescriptors.isArray()) {
            totalProcesses = processDescriptors.size();
            log.info("Found {} processes in openLCA.", totalProcesses);
            for (JsonNode processNode : processDescriptors) {
                String productName = processNode.path("name").asText();

                if (productName != null && !productName.isEmpty()) {
                    if (productRepository.findByNameContainingIgnoreCase(productName).isEmpty()) {
                        Product newProduct = new Product();
                        newProduct.setName(productName);
                        try {
                            productRepository.save(newProduct);
                            productsAdded.incrementAndGet();
                            log.debug("Added new product from sync: {}", productName);
                        } catch (Exception e) {
                            log.error("Failed to save synced product '{}': {}", productName, e.getMessage());
                        }
                    } else {
                        log.trace("Product '{}' already exists, skipping.", productName);
                    }
                }
            }
        } else {
             log.warn("No process descriptors received from openLCA during sync or response was invalid.");
             totalProcesses = 0;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("totalProcessesChecked", totalProcesses);
        result.put("newProductsAdded", productsAdded.get());
        result.put("message", String.format("Sync complete. Checked: %d, New products added: %d.",
                totalProcesses, productsAdded.get()));
        log.info("Product name sync finished: {}", result.get("message"));
        return result;
    }

    // --- Method for ON-DEMAND calculation AND saving (Accepts Weight) ---
    @Transactional
    // --- FIX: Add weight parameter ---
    public Map<String, Object> searchAndSave(String productName, BigDecimal weight) {
         // --- FIX: Log the weight being used ---
         log.info("Calculating and saving LCA data for product: '{}' with weight: {}", productName, weight);
         Product product = productRepository.findByNameContainingIgnoreCase(productName).stream().findFirst()
                 .orElseThrow(() -> new RuntimeException("Product '" + productName + "' not found in local database. Please ensure it was synced first or add it manually."));

         String resultId = null;
         BigDecimal climateChangeValue = null;
         String climateChangeUnit = null;
         // Use the provided weight, default to 1.0 if null or not positive
         BigDecimal calculationWeight = (weight != null && weight.compareTo(BigDecimal.ZERO) > 0) ? weight : BigDecimal.ONE;


         try {
             if (impactMethodId == null || climateChangeCategoryId == null) {
                 log.error("LCA parameters (Method ID, Category ID) not initialized. Cannot perform calculation. Check initial connection to openLCA.");
                 initializeLcaParameters();
                 if (impactMethodId == null || climateChangeCategoryId == null) {
                    throw new RuntimeException("LCA parameters could not be initialized. Cannot calculate. Check openLCA connection and configuration during startup.");
                 }
                 log.info("LCA parameters re-initialized successfully upon calculation request.");
             }

             log.debug("Searching for openLCA process ID for product '{}'", productName);
             JsonNode processDescriptors = olcaRequest("data/get/descriptors", Map.of("@type", "Process"));
             String processId = null;
             if (processDescriptors != null && processDescriptors.isArray()){
                 for(JsonNode node : processDescriptors){
                     if(node.path("name").asText("").equalsIgnoreCase(productName)){
                         processId = node.path("@id").asText();
                         log.debug("Found openLCA process ID '{}' for product '{}'", processId, productName);
                         break;
                     }
                 }
             }
             if (processId == null) {
                 log.error("Could not find a corresponding Process in openLCA matching the exact name: '{}'. Check spelling and case.", productName);
                 throw new RuntimeException("Could not find a corresponding Process in openLCA matching the exact name: '" + productName + "'. Check spelling and case in openLCA.");
             }

             // --- FIX: Use calculationWeight variable ---
             log.info("Starting openLCA calculation for Process ID: {} with amount: {}", processId, calculationWeight);
             Map<String, Object> calcParams = Map.of(
                 "target", Map.of("@type", "Process", "@id", processId),
                 "impactMethod", Map.of("@type", "ImpactMethod", "@id", impactMethodId),
                 "amount", calculationWeight.doubleValue() // Use the provided or default weight
             );
             JsonNode calcSetupResult = olcaRequest("result/calculate", calcParams);
             resultId = calcSetupResult.path("@id").asText(null);
             if (resultId == null) throw new RuntimeException("Could not get result ID from calculation setup response: " + calcSetupResult.toString());
             log.debug("Calculation started, openLCA result ID: {}", resultId);

             boolean isReady = false;
             for (int i = 0; i < 120; i++) { // 60 second timeout
                 Thread.sleep(500);
                 JsonNode stateResult = olcaRequest("result/state", Map.of("@id", resultId));
                 if (stateResult != null && stateResult.path("isReady").asBoolean(false)) {
                     isReady = true;
                     log.debug("Calculation ready for result ID {}", resultId);
                     break;
                 }
                 log.trace("Polling result state for ID {}... Attempt {}/120", resultId, i + 1);
             }
             if (!isReady) {
                 log.error("Calculation timed out for result ID {} after 60 seconds.", resultId);
                 throw new RuntimeException("Calculation timed out after 60 seconds.");
             }

             log.debug("Fetching flows and impacts for result ID {}", resultId);
             JsonNode flowsNode = olcaRequest("result/total-flows", Map.of("@id", resultId));
             JsonNode impactsNode = olcaRequest("result/total-impacts", Map.of("@id", resultId));
             log.debug("Fetched flows ({}) and impacts ({})",
                       (flowsNode != null && flowsNode.isArray()) ? flowsNode.size() : 0,
                       (impactsNode != null && impactsNode.isArray()) ? impactsNode.size() : 0);

             List<Flow> existingFlows = flowRepository.findByProductId(product.getId());
             if (!existingFlows.isEmpty()) {
                 log.debug("Deleting {} old flows and associated impacts for product ID {}", existingFlows.size(), product.getId());
                 existingFlows.forEach(flow -> {
                     List<Impact> impactsToDelete = impactRepository.findByFlowId(flow.getId());
                     if (!impactsToDelete.isEmpty()) {
                         impactRepository.deleteAll(impactsToDelete);
                     }
                 });
                 flowRepository.deleteAll(existingFlows);
                 log.debug("Finished deleting old data.");
             }

             int savedFlowCount = 0;
             int savedImpactCount = 0;
             if (flowsNode != null && flowsNode.isArray()) {
                 for (JsonNode flowNode : flowsNode) {
                     Flow flow = new Flow();
                     flow.setProduct(product);
                     JsonNode enviFlow = flowNode.path("enviFlow");
                     JsonNode enviFlowFlow = enviFlow.path("flow");
                     flow.setInputId(enviFlowFlow.path("name").asText("N/A"));
                     flow.setInputUnit(enviFlowFlow.path("refUnit").asText("N/A"));
                     flow.setInputValue(BigDecimal.valueOf(flowNode.path("amount").asDouble(0.0)));
                     flow.setOutputId(product.getName());
                     flow.setOutputUnit("unit");
                     flow.setOutputValue(calculationWeight); // Use the calculation weight here as the output value reference
                     Flow savedFlow = flowRepository.save(flow);
                     savedFlowCount++;

                     if (impactsNode != null && impactsNode.isArray()) {
                         for (JsonNode impactNode : impactsNode) {
                             JsonNode categoryNode = impactNode.path("impactCategory");
                             if (categoryNode.isObject() && categoryNode.has("@id") && categoryNode.has("name") && categoryNode.has("refUnit")) {
                                 Impact impact = new Impact();
                                 impact.setFlow(savedFlow);
                                 impact.setMethodId(impactMethodName);
                                 impact.setImpactId(categoryNode.path("name").asText("N/A"));
                                 impact.setImpactIdUnit(categoryNode.path("refUnit").asText("N/A"));
                                 impact.setImpactValue(BigDecimal.valueOf(impactNode.path("amount").asDouble(0.0)));
                                 impactRepository.save(impact);
                                 savedImpactCount++;

                                 if (climateChangeCategoryId != null && climateChangeCategoryId.equals(categoryNode.path("@id").asText())) {
                                     climateChangeValue = impact.getImpactValue();
                                     climateChangeUnit = impact.getImpactIdUnit();
                                     log.debug("Captured climate change impact for weight {}: {} {}", calculationWeight, climateChangeValue, climateChangeUnit);
                                 }
                             }
                         }
                     }
                 }
                 log.info("Successfully saved {} flows and {} associated impacts for product '{}' (weight: {})", savedFlowCount, savedImpactCount, productName, calculationWeight);
             } else {
                  log.warn("Received empty or invalid flows data for '{}'", productName);
             }

         } catch (InterruptedException ie) {
             Thread.currentThread().interrupt();
             String errorMsg = "Calculation thread interrupted for " + productName + ": " + ie.getMessage();
             log.error(errorMsg, ie);
             throw new RuntimeException(errorMsg, ie);
         } catch (Exception calcError) {
             String errorMsg = "Failed calculation/saving for '" + productName + "' (weight " + calculationWeight + "): " + calcError.getMessage();
             log.error(errorMsg, calcError);
             throw new RuntimeException(errorMsg, calcError);
         } finally {
             if (resultId != null) {
                 try {
                     olcaRequest("result/dispose", Map.of("@id", resultId));
                     log.debug("Disposed result ID {}", resultId);
                 } catch (Exception disposeError) {
                     log.warn("Failed to dispose result ID {}: {}", resultId, disposeError.getMessage());
                 }
             }
         }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "LCA data fetched and saved for product: " + productName + " (weight: " + calculationWeight + ")");
        result.put("climateChangeImpact", climateChangeValue);
        result.put("impactUnit", climateChangeUnit);
        return result;
    }


    private JsonNode olcaRequest(String method, Map<String, Object> params) {
        // ... (olcaRequest logic remains unchanged) ...
        Map<String, Object> requestBody = Map.of(
            "jsonrpc", "2.0",
            "id", jsonRpcRequestId.getAndIncrement(),
            "method", method,
            "params", params
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.debug("Sending openLCA request: Method={}, Params={}", method, params);

        ResponseEntity<String> response = null;
        try {
            response = restTemplate.exchange(olcaUrl, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
             log.error("Network error calling openLCA ({} {}): {}", HttpMethod.POST, olcaUrl, e.getMessage());
             throw new RuntimeException("Could not connect to openLCA IPC server at " + olcaUrl + ". Ensure it's running and accessible.", e);
        }

        log.trace("Received openLCA response: Status={}, Body={}", response.getStatusCode(), response.getBody());

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            log.error("HTTP Error calling openLCA: Status={}, Method={}, Body={}", response.getStatusCode(), method, response.getBody());
            throw new RuntimeException("Received HTTP Error: " + response.getStatusCode() + " from openLCA for method " + method);
        }

        try {
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            if (rootNode.has("error")) {
                JsonNode errorNode = rootNode.path("error");
                String errorMsg = "openLCA Error for method '" + method + "': " + errorNode.path("message").asText("Unknown error") + " (Code: " + errorNode.path("code").asInt() + ")";
                 String errorData = errorNode.hasNonNull("data") ? errorNode.path("data").toString() : "N/A";
                 log.error("{}. Data: {}", errorMsg, errorData);
                throw new RuntimeException(errorMsg);
            }
            log.debug("Successfully parsed openLCA response for method {}", method);
            return rootNode.hasNonNull("result") ? rootNode.path("result") : null;
        } catch (JsonProcessingException e) {
             log.error("Failed to parse JSON response from openLCA for method {}: {}", method, response.getBody(), e);
            throw new RuntimeException("Failed to parse JSON response from openLCA for method " + method, e);
        }
    }
}

