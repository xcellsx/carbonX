package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.dto.DashboardSummary;
import com.ecapybara.carbonx.model.Company;
import com.ecapybara.carbonx.model.ProductInventory;
import com.ecapybara.carbonx.repository.CompanyInfoRepository;
import com.ecapybara.carbonx.repository.ProductInventoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/summary/{userId}")
    public DashboardSummary getDashboardSummary(@PathVariable String userId) {
        
        // --- REQ 2: Display Corresponding Metrics ---
        // Fetch the "activeMetrics" list from the CompanyInfo table in the DB.
        // This ensures the dashboard layout matches the user's specific industry.
        List<String> activeMetrics = companyInfoRepository.findByUserId(userId)
                .map(Company::getActiveMetrics)
                .orElse(new ArrayList<>());

        // --- REQ 1: Find Total Number of Products ---
        // Fetch the inventory list directly from the DB.
        List<ProductInventory> products = productInventoryRepository.findByUserId(userId);
        int productCount = products.size();

        // --- CALCULATION LOGIC ---
        double totalLca = 0.0;
        double totalTransportLca = 0.0;

        for (ProductInventory p : products) {
            // 1. Sum Total GHG (Stored in the column 'lcaResult')
            if (p.getLcaResult() != null) {
                totalLca += p.getLcaResult();
            }

            // 2. Sum Transport GHG (Deep dive into the stored JSON)
            // We look for items flagged with "isTransport": true inside the dppData JSON.
            if (p.getDppData() != null && !p.getDppData().isEmpty()) {
                try {
                    JsonNode root = objectMapper.readTree(p.getDppData());
                    if (root.isArray()) {
                        for (JsonNode node : root) {
                            if (node.has("isTransport") && node.get("isTransport").asBoolean()) {
                                if (node.has("lcaValue") && !node.get("lcaValue").isNull()) {
                                    totalTransportLca += node.get("lcaValue").asDouble();
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Dashboard Calc Error: Failed to parse DPP for product " + p.getProductId());
                }
            }
        }

        // --- EXTRA: Top Contributors ---
        // Sort products by impact to show "Top Polluters"
        List<Map<String, Object>> topContributors = products.stream()
            .filter(p -> p.getLcaResult() != null && p.getLcaResult() > 0)
            .sorted((p1, p2) -> Double.compare(p2.getLcaResult(), p1.getLcaResult())) // Descending
            .limit(5)
            .map(p -> Map.of(
                "name", (Object) p.getProductName(), 
                "value", (Object) p.getLcaResult()
            ))
            .collect(Collectors.toList());

        // Return the fully populated object
        return new DashboardSummary(productCount, activeMetrics, totalLca, totalTransportLca, topContributors);
    }
}
