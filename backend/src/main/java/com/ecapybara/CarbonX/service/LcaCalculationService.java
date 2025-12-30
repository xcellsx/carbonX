package com.ecapybara.carbonx.service;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.model.Product;
import com.ecapybara.carbonx.repository.ProductRepository;
import com.ecapybara.carbonx.service.LCAService;

@Service
public class LcaCalculationService {

    @Autowired
    private ProductRepository productRepository; 

    // Mapping logic
    private static final Map<String, String> INGREDIENT_TO_PROCESS_MAP = Map.of(
        "Dried white sesame", "Rapsanbau (Rapskorn), ab Feld",
        "Transport (Road)", "Rapskorn Transport, ab Hof",
        "Plastic pouch", "Rapskorn Lagerung, ab Lagerung" 
    );

    private static final String TARGET_IMPACT_CATEGORY = "ReCiPe 2016 v1.03, midpoint (H) - Climate change";
    
    // Default distance fallback (in km)
    private static final double DEFAULT_TRANSPORT_DISTANCE_KM = 100.0;

    /**
     * Orchestrates the calculation for a single DPP item.
     */
    public Map<String, Object> calculateLcaForItem(Map<String, Object> item) {
        String ingredientName = (String) item.getOrDefault("ingredient", "");
        double amountValue = ((Number) item.getOrDefault("weightKg", 0.0)).doubleValue();
        
        double amountToCalculate = amountValue; 

        // --- SPECIAL HANDLING FOR TRANSPORT ---
        if (Boolean.TRUE.equals(item.get("isTransport"))) {
            // For transport, 'weightKg' in the item map now actually holds the DISTANCE in km 
            // (passed from frontend).
            double distanceKm = amountValue;

            // Fallback if distance is 0 or missing
            if (distanceKm <= 0.001) {
                 distanceKm = DEFAULT_TRANSPORT_DISTANCE_KM;
                 // Update the item so the user sees the default being applied? 
                 // Optionally: item.put("weightKg", distanceKm); 
            }

            // Transport processes usually require units of 't*km' (tonne-kilometers)
            // We need to know the payload weight. 
            // CRITICAL: The 'item' map for the *transport row* doesn't inherently know the 
            // total weight of the *other* ingredients. 
            
            // Simplification: Assuming the transport is for 1 kg of product (since your CSV 
            // implies a 1kg pack). 
            // Total payload = 1 kg = 0.001 tonnes.
            double payloadTonnes = 0.001; 
            
            // Calculate t*km
            amountToCalculate = payloadTonnes * distanceKm;
            
            System.out.println("Transport detected: " + ingredientName);
            System.out.println("  Distance: " + distanceKm + " km");
            System.out.println("  Payload: " + payloadTonnes + " t");
            System.out.println("  Calculated Amount (t*km): " + amountToCalculate);
        }
        
        // 1. Map friendly name to Process Name
        String processName = INGREDIENT_TO_PROCESS_MAP.getOrDefault(ingredientName, ingredientName);

        // 2. Find Process ID from DB
        Optional<Product> product = productRepository.findByName(processName);

        if (product.isEmpty()) {
            System.err.println("LCA Error: No master product found for name: " + processName);
            item.put("lcaValue", 0.0);
            return item; 
        }

        String processId = process.getId();

        // 3. Request Calculation from OpenLCA Service
        double calculatedImpact = LCAService.calculateImpact(processId, amountToCalculate);

        // 4. Update item with results
        item.put("lcaValue", calculatedImpact);
        item.put("materialId", processId); 
        item.put("impactCategory", TARGET_IMPACT_CATEGORY);
        
        return item;
    }
}
