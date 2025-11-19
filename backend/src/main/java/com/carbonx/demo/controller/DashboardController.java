package com.carbonx.demo.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.dto.DashboardSummary;
import com.carbonx.demo.model.CompanyInfo;
import com.carbonx.demo.model.ProductInventory;
import com.carbonx.demo.repository.CompanyInfoRepository;
import com.carbonx.demo.repository.ProductInventoryRepository;
import com.fasterxml.jackson.databind.JsonNode; // You might need to import Jackson
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
        
        // 1. Get Active Metrics (User Preferences)
        List<String> activeMetrics = companyInfoRepository.findByUserId(userId)
                .map(CompanyInfo::getActiveMetrics)
                .orElse(new ArrayList<>());

        // 2. Get Inventory
        List<ProductInventory> products = productInventoryRepository.findByUserId(userId);
        int productCount = products.size();

        // 3. Calculate Totals (GHG and Transport)
        double totalLca = 0.0;
        double totalTransportLca = 0.0;

        for (ProductInventory p : products) {
            // Total GHG
            if (p.getLcaResult() != null) {
                totalLca += p.getLcaResult();
            }

            // Transport GHG (Parse the JSON dppData)
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
                    System.err.println("Error parsing DPP data for product " + p.getProductId() + ": " + e.getMessage());
                }
            }
        }

        // 4. Calculate Top Contributors (Top 5 products by LCA)
        List<Map<String, Object>> topContributors = products.stream()
            .filter(p -> p.getLcaResult() != null && p.getLcaResult() > 0)
            .sorted((p1, p2) -> Double.compare(p2.getLcaResult(), p1.getLcaResult()))
            .limit(5)
            .map(p -> Map.of(
                "name", (Object) p.getProductName(), 
                "value", (Object) p.getLcaResult()
            ))
            .collect(Collectors.toList());

        // 5. Return DTO
        return new DashboardSummary(productCount, activeMetrics, totalLca, totalTransportLca, topContributors);
    }
}