package com.ecapybara.carbonx.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.ecapybara.carbonx.model.ProductInventory;
import com.ecapybara.carbonx.repository.ProductInventoryRepository;

@Service
public class ProductInventoryService {

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    @Autowired
    private LcaCalculationService lcaCalculationService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Orchestrates the full LCA calculation for every component in a product.
     */
    public ProductInventory calculateLcaForProduct(Long productId) throws Exception {
        // 1. Find the product
        ProductInventory product = productInventoryRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // 2. Parse the dppData string into a list of components
        TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<>() {};
        List<Map<String, Object>> components = objectMapper.readValue(product.getDppData(), typeRef);

        List<Map<String, Object>> updatedComponents = new ArrayList<>();
        double totalLca = 0.0;

        // 3. Iterate and calculate each component
        for (Map<String, Object> item : components) {
            // Only calculate if it hasn't been calculated before (or re-calculate all to be safe)
            // In this full-calc mode, let's ensure everything is up to date.
            item = lcaCalculationService.calculateLcaForItem(item);
            
            updatedComponents.add(item);
            
            // Sum up the total LCA
            if (item.get("lcaValue") instanceof Number) {
                totalLca += ((Number) item.get("lcaValue")).doubleValue();
            }
        }

        // 4. Save the updated data back to the product
        product.setDppData(objectMapper.writeValueAsString(updatedComponents));
        product.setLcaResult(totalLca);

        // 5. Save to DB and return
        return productInventoryRepository.save(product);
    }

    // --- NEW METHOD: Calculate Single Item ---
    public ProductInventory calculateLcaForItem(Long productId, int itemIndex, double weight) throws Exception {
        // 1. Find Product
        ProductInventory product = productInventoryRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // 2. Parse JSON
        TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<>() {};
        List<Map<String, Object>> components = objectMapper.readValue(product.getDppData(), typeRef);

        if (itemIndex < 0 || itemIndex >= components.size()) {
            throw new IllegalArgumentException("Invalid item index: " + itemIndex);
        }

        // 3. Update the specific item
        Map<String, Object> item = components.get(itemIndex);
        item.put("weightKg", weight); // Update weight
        
        // 4. Re-calculate ONLY this item
        item = lcaCalculationService.calculateLcaForItem(item);
        components.set(itemIndex, item);

        // 5. Re-calculate Total LCA (Sum up all existing values)
        double totalLca = 0.0;
        for (Map<String, Object> comp : components) {
             if (comp.get("lcaValue") instanceof Number) {
                totalLca += ((Number) comp.get("lcaValue")).doubleValue();
            }
        }

        // 6. Save & Return
        product.setDppData(objectMapper.writeValueAsString(components));
        product.setLcaResult(totalLca);
        
        return productInventoryRepository.save(product);
  }
}
