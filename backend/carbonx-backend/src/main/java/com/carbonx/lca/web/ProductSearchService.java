package com.carbonx.lca.service;

import com.carbonx.lca.domain.Flow;
import com.carbonx.lca.domain.Impact;
import com.carbonx.lca.domain.Product;
import com.carbonx.lca.dto.ProductInventoryDTO; // Ensure this import is present
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
import org.springframework.http.*; // Required for HttpEntity, HttpHeaders, MediaType, ResponseEntity

import jakarta.annotation.PostConstruct; // For initializing method/category IDs
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong; // For unique request IDs
import java.util.stream.Collectors; // Ensure this import is present


@Service
public class ProductSearchService {

    private static final Logger log = LoggerFactory.getLogger(ProductSearchService.class);

    private final ProductRepository productRepository;
    private final FlowRepository flowRepository;
    private final ImpactRepository impactRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AtomicLong jsonRpcRequestId = new AtomicLong(1); // Ensure unique request IDs

    @Value("${olca.ipcBaseUrl}")
    private String olcaUrl;

    // --- Variables to store dynamically fetched IDs ---
    private String impactMethodId;
    private String impactMethodName;
    private String climateChangeCategoryId;
    // ---

    public ProductSearchService(ProductRepository productRepository, FlowRepository flowRepository, ImpactRepository impactRepository) {
        this.productRepository = productRepository;
        this.flowRepository = flowRepository;
        this.impactRepository = impactRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // --- Initialize Method and Category IDs on startup ---
    @PostConstruct
    private void initializeLcaParameters() {
        log.info("Attempting to initialize LCA parameters from openLCA at {}...", olcaUrl);
        // This method remains the same - it's still needed for on-demand calculations
        // It attempts to fetch necessary IDs from openLCA if available at startup.
        try {
            // Check basic connectivity first before proceeding
             try {
                // Use a simple known method, adjust timeout as needed (e.g., 2 seconds)
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                Map<String, Object> pingBody = Map.of("jsonrpc", "2.0", "id", jsonRpcRequestId.getAndIncrement(), "method", "ping");
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(pingBody, headers);
                // Consider adding a timeout to restTemplate configuration globally
                restTemplate.exchange(olcaUrl, HttpMethod.POST, entity, String.class);
                 log.info("Successfully pinged openLCA IPC server.");
            } catch (Exception connErr) {
                log.warn("Could not connect to openLCA IPC server at {} during startup. On-demand calculations will likely fail until it's available. Error: {}", olcaUrl, connErr.getMessage());
                return; // Stop initialization if server isn't reachable
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
                return; // Allow app to start, but calculations will fail
            }
            this.impactMethodId = foundMethod.path("@id").asText();
            this.impactMethodName = foundMethod.path("name").asText();
            log.info("Found Impact Method: ID={}, Name={}", impactMethodId, impactMethodName);

            String categorySearchName = "climate change";
            JsonNode methodDetails = olcaRequest("data/get", Map.of("@type", "ImpactMethod", "@id", this.impactMethodId));
            JsonNode categories = methodDetails != null ? methodDetails.path("impactCategories") : null;

            JsonNode foundCategory = null;
            if (categories != null && categories.isArray()) {
                 for (JsonNode category : categories) {
                     String nameLower = category.path("name").asText("").toLowerCase();
                     if (nameLower.contains(categorySearchName)) {
                         foundCategory = category;
                         break;
                     }
                 }
            }
            if (foundCategory == null) {
                 log.warn("Required Impact Category '{}' not found within method '{}'.", categorySearchName, this.impactMethodName);
                 return; // Allow app to start
            }
            this.climateChangeCategoryId = foundCategory.path("@id").asText();
            log.info("Found Impact Category: ID={}, Name={}", climateChangeCategoryId, foundCategory.path("name").asText());
            log.info("LCA parameters initialized successfully.");

        } catch (Exception e) {
            // Log error but allow application to start. Calculations will fail if IDs are null.
             log.error("Could not initialize required LCA parameters from openLCA during startup. On-demand calculations might fail later. Error: {}", e.getMessage(), e); // Log stack trace too
        }
    }

    // --- REVERTED Sync method: ONLY saves product names ---
    @Transactional
    public Map<String, Object> syncAllProductsFromOpenLCA() {
        log.info("Starting sync of product names from openLCA...");
        JsonNode processDescriptors = null;
        try {
             processDescriptors = olcaRequest("data/get/descriptors", Map.of("@type", "Process"));
        } catch (Exception e) {
             // Log error and return failure message
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
                    // Check if the product already exists (case-insensitive)
                    if (productRepository.findByNameContainingIgnoreCase(productName).isEmpty()) {
                        Product newProduct = new Product();
                        newProduct.setName(productName);
                        try {
                            productRepository.save(newProduct);
                            productsAdded.incrementAndGet();
                            log.debug("Added new product from sync: {}", productName);
                        } catch (Exception e) {
                            log.error("Failed to save synced product '{}': {}", productName, e.getMessage());
                            // Optionally, collect these errors to report back
                        }
                    } else {
                        log.trace("Product '{}' already exists, skipping.", productName);
                    }
                }
            }
        } else {
             log.warn("No process descriptors received from openLCA during sync or response was invalid.");
             totalProcesses = 0; // Correct count if response was bad
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


    // --- Method for ON-DEMAND calculation AND saving (No changes needed here) ---
    @Transactional
    public Map<String, Object> searchAndSave(String productName) {
         log.info("Calculating and saving LCA data for product: {}", productName);
         // Find product in our DB first
         Product product = productRepository.findByNameContainingIgnoreCase(productName).stream().findFirst()
                 .orElseThrow(() -> new RuntimeException("Product '" + productName + "' not found in local database. Please ensure it was synced first or add it manually."));

         long resultId = -1; // Use -1 to indicate not yet obtained
         try {
             // CRITICAL: Check if LCA parameters were initialized successfully
             if (impactMethodId == null || climateChangeCategoryId == null) {
                 log.error("LCA parameters (Method ID, Category ID) not initialized. Cannot perform calculation. Check initial connection to openLCA.");
                 // Try to re-initialize; might succeed if openLCA is now running
                 initializeLcaParameters();
                 if (impactMethodId == null || climateChangeCategoryId == null) {
                    throw new RuntimeException("LCA parameters could not be initialized. Cannot calculate. Check openLCA connection and configuration during startup.");
                 }
                 log.info("LCA parameters re-initialized successfully upon calculation request.");
             }

             // Find corresponding Process ID in openLCA
             log.debug("Searching for openLCA process ID for product '{}'", productName);
             JsonNode processDescriptors = olcaRequest("data/get/descriptors", Map.of("@type", "Process"));
             String processId = null;
             if (processDescriptors != null && processDescriptors.isArray()){
                 for(JsonNode node : processDescriptors){
                     if(node.path("name").asText("").equalsIgnoreCase(productName)){ // Case-insensitive compare
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

             // --- Perform Calculation ---
             log.info("Starting openLCA calculation for Process ID: {}", processId);
             // A) Setup Calculation
             Map<String, Object> calcParams = Map.of(
                 "target", Map.of("@type", "Process", "@id", processId),
                 "impactMethod", Map.of("@type", "ImpactMethod", "@id", impactMethodId),
                 "amount", 1.0 // Default weight 1kg
             );
             JsonNode calcSetupResult = olcaRequest("result/calculate", calcParams);
             resultId = calcSetupResult.path("@id").asLong(-1);
             if (resultId == -1) throw new RuntimeException("Could not get result ID from calculation setup response: " + calcSetupResult.toString());
             log.debug("Calculation started, openLCA result ID: {}", resultId);

             // B) Wait for Ready State
             boolean isReady = false;
             for (int i = 0; i < 120; i++) { // 60 second timeout
                 Thread.sleep(500); // Poll every 500ms
                 JsonNode stateResult = olcaRequest("result/state", Map.of("@id", resultId));
                 if (stateResult != null && stateResult.path("isReady").asBoolean(false)) { // Check path exists and is true
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

             // C) Fetch Flows and Impacts
             log.debug("Fetching flows and impacts for result ID {}", resultId);
             JsonNode flowsNode = olcaRequest("result/total-flows", Map.of("@id", resultId));
             JsonNode impactsNode = olcaRequest("result/total-impacts", Map.of("@id", resultId));
             log.debug("Fetched flows ({}) and impacts ({})",
                       (flowsNode != null && flowsNode.isArray()) ? flowsNode.size() : 0,
                       (impactsNode != null && impactsNode.isArray()) ? impactsNode.size() : 0);

             // D) Delete existing data for this product
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

             // E) Save new Flows and Impacts
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
                     flow.setOutputId(product.getName()); // Simplification
                     flow.setOutputUnit("unit");          // Simplification
                     flow.setOutputValue(BigDecimal.ONE); // Simplification
                     Flow savedFlow = flowRepository.save(flow);
                     savedFlowCount++;

                     if (impactsNode != null && impactsNode.isArray()) {
                         for (JsonNode impactNode : impactsNode) {
                             JsonNode categoryNode = impactNode.path("impactCategory");
                             if (categoryNode.isObject() && categoryNode.has("name") && categoryNode.has("refUnit")) {
                                 Impact impact = new Impact();
                                 impact.setFlow(savedFlow);
                                 impact.setMethodId(impactMethodName);
                                 impact.setImpactId(categoryNode.path("name").asText("N/A"));
                                 impact.setImpactIdUnit(categoryNode.path("refUnit").asText("N/A"));
                                 impact.setImpactValue(BigDecimal.valueOf(impactNode.path("amount").asDouble(0.0)));
                                 impactRepository.save(impact);
                                 savedImpactCount++;
                             }
                         }
                     }
                 }
                 log.info("Successfully saved {} flows and {} impacts for product '{}'", savedFlowCount, savedImpactCount, productName);
             } else {
                  log.warn("Received empty or invalid flows data for '{}'", productName);
             }

         } catch (InterruptedException ie) {
             Thread.currentThread().interrupt(); // Restore interrupt status
             String errorMsg = "Calculation thread interrupted for " + productName + ": " + ie.getMessage();
             log.error(errorMsg, ie);
             throw new RuntimeException(errorMsg, ie);
         } catch (Exception calcError) {
             String errorMsg = "Failed calculation/saving for '" + productName + "': " + calcError.getMessage();
             log.error(errorMsg, calcError); // Log the full stack trace
             throw new RuntimeException(errorMsg, calcError); // Re-throw to inform frontend
         } finally {
             // F) Dispose Result on openLCA server
             if (resultId != -1) {
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
        result.put("message", "LCA data fetched and saved for product: " + productName);
        return result;
    }


    // --- Helper Method for openLCA JSON-RPC Requests ---
    private JsonNode olcaRequest(String method, Map<String, Object> params) {
        // This method remains the same
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

    // --- Method to get inventory with impacts (for displaying in main table) ---
    public List<ProductInventoryDTO> getInventoryWithImpacts(String searchTerm) {
        // This method remains the same - it fetches products and joins with saved impact data
        List<Product> products;
        if (searchTerm != null && !searchTerm.isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCase(searchTerm);
        } else {
             // Now fetches all products from DB for the initial/empty search view
            products = productRepository.findAll();
        }
         log.debug("Found {} products locally matching search '{}'", products.size(), searchTerm);

        return products.stream().map(product -> {
            BigDecimal impactValue = null;
            String impactUnit = null;
            Optional<Flow> firstFlowOpt = flowRepository.findByProductId(product.getId()).stream().findFirst();

            if (firstFlowOpt.isPresent()) {
                Optional<Impact> impactOpt = impactRepository.findFirstByFlowIdAndImpactIdContainingIgnoreCase(
                        firstFlowOpt.get().getId(), "Climate change");

                if (impactOpt.isPresent()) {
                    impactValue = impactOpt.get().getImpactValue();
                    impactUnit = impactOpt.get().getImpactIdUnit();
                     log.trace("Found impact for product '{}': {} {}", product.getName(), impactValue, impactUnit);
                } else {
                     log.trace("No 'Climate change' impact found for flow ID {} (Product '{}')", firstFlowOpt.get().getId(), product.getName());
                }
            } else {
                 log.trace("No flows found for product ID {} ('{}')", product.getId(), product.getName());
            }
            return new ProductInventoryDTO(product.getId(), product.getName(), impactValue, impactUnit);
        }).collect(Collectors.toList());
    }
}

