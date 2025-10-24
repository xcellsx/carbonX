package com.carbonx.lca.service;

import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.dto.FullAnalyticsDTO;
import com.carbonx.lca.dto.ImpactCategoryDTO;
import com.carbonx.lca.dto.ImpactResultDTO;
import com.carbonx.lca.dto.InventoryFlowDTO;
import com.carbonx.lca.repo.InventoryItemRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LcaService {

    private final InventoryItemRepository inventoryItemRepository;
    private final JsonRpcClient olcaClient;
    private final String lcaMethodId;
    private final String impactCategoryId;
    private static final Logger log = LoggerFactory.getLogger(LcaService.class);

    public LcaService(InventoryItemRepository inventoryItemRepository,
                      JsonRpcClient olcaClient,
                      @Value("${olca.methodId}") String lcaMethodId,
                      @Value("${olca.impactCategoryId}") String impactCategoryId) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.olcaClient = olcaClient;
        this.lcaMethodId = lcaMethodId;
        this.impactCategoryId = impactCategoryId;
    }

    @PostConstruct
    public void logAvailableOlcaIds() {
        try {
            log.info("Fetching available openLCA Impact Methods and Categories...");

            // 1. Get all available Impact Methods
            List<Map<String, Object>> methods = olcaClient.call(
                "ImpactMethod/findDescriptors",
                Collections.emptyMap(),
                new TypeReference<>() {}
            );

            log.info("========================================================================");
            log.info("AVAILABLE IMPACT METHODS");
            log.info("========================================================================");

            if (methods.isEmpty()) {
                log.warn("No Impact Methods found. Is openLCA running and connected?");
            }

            // 2. For each method, get its Impact Categories
            for (Map<String, Object> method : methods) {
                String methodId = (String) method.get("@id");
                String methodName = (String) method.get("name");

                log.info("");
                log.info("METHOD: '{}'", methodName);
                log.info("  └─ olca.methodId: '{}'", methodId);

                List<ImpactCategoryDTO> categories = olcaClient.call(
                    "ImpactMethod/getImpactCategories",
                    Map.of("@id", methodId),
                    new TypeReference<>() {}
                );

                if (categories.isEmpty()) {
                    log.info("    └─ No impact categories found for this method.");
                } else {
                    log.info("    AVAILABLE IMPACT CATEGORIES:");
                    for (ImpactCategoryDTO category : categories) {
                        log.info("    - CATEGORY: '{}'", category.getName());
                        log.info("      └─ olca.impactCategoryId: '{}'", category.getAtId());
                    }
                }
            }
            log.info("========================================================================");

        } catch (Exception e) {
            log.error("Failed to fetch openLCA IDs: " + e.getMessage(), e);
        }
    }

    public void calculateLcaAndSave(UUID itemId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
        if (item.getProcessId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not mapped to an openLCA process ID.");
        }
        
        String resultId = null;
        try {
            var setupParams = Map.<String, Object>of("target", Map.of("@type", "Process", "@id", item.getProcessId()), "impactMethod", Map.of("@type", "ImpactMethod", "@id", lcaMethodId), "amount", item.getWeight());
            Map<String, Object> setupResult = olcaClient.call("result/calculate", setupParams, new TypeReference<>() {});
            resultId = (String) setupResult.get("@id");

            for (int i = 0; i < 40; i++) {
                Map<String, Object> state = olcaClient.call("result/state", Map.of("@id", resultId), new TypeReference<>() {});
                if ((boolean) state.get("isReady")) break;
                Thread.sleep(500);
            }

            List<ImpactResultDTO> allImpacts = olcaClient.call("result/total-impacts", Map.of("@id", resultId), new TypeReference<List<ImpactResultDTO>>() {});
            allImpacts.stream()
                .filter(impact -> impact.getImpactCategory() != null && this.impactCategoryId.equals(impact.getImpactCategory().getAtId()))
                .findFirst()
                .ifPresent(climateImpact -> item.setLcaResult(climateImpact.getAmount()));
            inventoryItemRepository.save(item);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate LCA: " + e.getMessage(), e);
        } finally {
            if (resultId != null) {
                try {
                    olcaClient.call("result/dispose", Map.of("@id", resultId), new TypeReference<>() {});
                } catch (IOException e) {
                    System.err.println("Failed to dispose of LCA result: " + e.getMessage());
                }
            }
        }
    }
    
    public FullAnalyticsDTO getAnalyticsForProduct(UUID id) throws IOException {
        InventoryItem item = inventoryItemRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
        if (item.getProcessId() == null || item.getLcaResult() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LCA for this product has not been calculated yet.");
        }

        String resultId = null;
        try {
            var setupParams = Map.<String, Object>of("target", Map.of("@type", "Process", "@id", item.getProcessId()), "impactMethod", Map.of("@type", "ImpactMethod", "@id", lcaMethodId), "amount", item.getWeight());
            Map<String, Object> setupResult = olcaClient.call("result/calculate", setupParams, new TypeReference<>() {});
            resultId = (String) setupResult.get("@id");

            for (int i = 0; i < 40; i++) {
                Map<String, Object> state = olcaClient.call("result/state", Map.of("@id", resultId), new TypeReference<>() {});
                if ((boolean) state.get("isReady")) break;
                Thread.sleep(500);
            }

            List<ImpactResultDTO> allImpacts = olcaClient.call("result/total-impacts", Map.of("@id", resultId), new TypeReference<List<ImpactResultDTO>>() {});
            
            double totalImpact = 0;
            for (ImpactResultDTO impact : allImpacts) {
                totalImpact += impact.getAmount();
            }
            
            final double finalTotalImpact = totalImpact;
            allImpacts.forEach(impact -> impact.setContribution(finalTotalImpact > 0 ? Math.abs(impact.getAmount()) / Math.abs(finalTotalImpact) : 0));
            
            List<ImpactResultDTO> top5Impacts = allImpacts.stream()
                .sorted(Comparator.comparingDouble((ImpactResultDTO impact) -> Math.abs(impact.getAmount())).reversed())
                .limit(5)
                .collect(Collectors.toList());

            List<InventoryFlowDTO> allFlows = olcaClient.call("result/total-flows", Map.of("@id", resultId), new TypeReference<List<InventoryFlowDTO>>() {});

            List<InventoryFlowDTO> filteredInventory = allFlows.stream()
                .filter((InventoryFlowDTO flow) -> flow.getAmount() != 0)
                .sorted(Comparator.comparingDouble((InventoryFlowDTO flow) -> Math.abs(flow.getAmount())).reversed())
                .collect(Collectors.toList());
            
            double totalFlowAmount = 0;
            for (InventoryFlowDTO flow : filteredInventory) {
                totalFlowAmount += flow.getAmount();
            }

            final double finalTotalFlowAmount = totalFlowAmount;
            filteredInventory.forEach(flow -> flow.setContribution(finalTotalFlowAmount > 0 ? Math.abs(flow.getAmount()) / Math.abs(finalTotalFlowAmount) : 0));

            var analyticsDTO = new FullAnalyticsDTO();
            analyticsDTO.setTopImpacts(top5Impacts);
            analyticsDTO.setInventory(filteredInventory.stream().limit(10).collect(Collectors.toList()));
            return analyticsDTO;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Calculation was interrupted.", e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to perform LCA calculation: " + e.getMessage(), e);
        } finally {
            if (resultId != null) {
                try {
                    olcaClient.call("result/dispose", Map.of("@id", resultId), new TypeReference<>() {});
                } catch (IOException e) {
                    System.err.println("Failed to dispose of LCA result: " + e.getMessage());
                }
            }
        }
    }
}