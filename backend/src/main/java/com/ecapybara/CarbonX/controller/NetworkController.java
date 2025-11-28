package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.ProductInventory;
import com.ecapybara.carbonx.repository.ProductInventoryRepository;
import com.ecapybara.carbonx.service.LCAService;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/network")
public class NetworkController {

    @Autowired
    private ProductInventoryRepository inventoryRepo;

    @Autowired
    private LCAService lcaService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/product-network")
    public ResponseEntity<?> getProductNetwork(
            @RequestParam Long productId,
            @RequestParam(required = false) String impactCategoryId
    ) {
        
        ProductInventory product = inventoryRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        String dppDataString = product.getDppData();
        List<Map<String, Object>> components;
        try {
            if (dppDataString == null || dppDataString.isEmpty()) {
                return ResponseEntity.ok(new HashMap<>()); 
            }
            components = objectMapper.readValue(dppDataString, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to parse DPP data: " + e.getMessage());
        }

        List<Map<String, Object>> responseList = new ArrayList<>();

        for (Map<String, Object> component : components) {
            String processIdentifier = (String) component.get("processId");
            if (processIdentifier == null) processIdentifier = (String) component.get("materialId");
            if (processIdentifier == null) processIdentifier = (String) component.get("process");
            if (processIdentifier == null) processIdentifier = (String) component.get("ingredient");

            Double weight = 0.0;
            if (component.get("weightKg") != null) {
                 weight = ((Number) component.get("weightKg")).doubleValue();
            }

            if (processIdentifier == null || processIdentifier.isEmpty()) continue;

            String processUuid = lcaService.resolveProcessIdentifier(processIdentifier);
            if (processUuid == null) continue; 
            
            Map<String, Object> result = lcaService.getSankeyGraph(processUuid, weight, impactCategoryId);

            Map<String, Object> componentResult = new HashMap<>();
            String compName = (String) (component.get("component") != null ? component.get("component") : component.get("ingredient"));
            
            componentResult.put("componentName", compName);
            componentResult.put("graphData", result);
            
            responseList.add(componentResult);
        }
        
        Map<String, Object> finalResponse = new HashMap<>();
        finalResponse.put("componentGraphs", responseList);
        finalResponse.put("productName", product.getProductName());
        // --- ADDED: Pass the stored Inventory Total ---
        finalResponse.put("inventoryTotal", product.getLcaResult());
        
        return ResponseEntity.ok(finalResponse);
    }
}
