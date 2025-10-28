package com.carbonx.demo.controller;

import com.carbonx.demo.dto.DashboardSummary;
import com.carbonx.demo.model.ProductInventory;
import com.carbonx.demo.repository.ProductInventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ProductInventoryRepository inventoryRepo;

    @GetMapping("/summary/{userId}")
    public DashboardSummary getDashboardSummary(@PathVariable Long userId) {
        List<ProductInventory> inventoryList = inventoryRepo.findByUserId(userId);

        // Calculate total emissions
        double totalEmissions = inventoryList.stream()
                .mapToDouble(item -> item.getLcaResult() != null ? item.getLcaResult() : 0.0)
                .sum();

        // Find top 4 contributors (filter out nulls/zeros, sort, take top 4)
        List<Map<String, Object>> topContributors = inventoryList.stream()
                .filter(item -> item.getLcaResult() != null && item.getLcaResult() > 0)
                .sorted(Comparator.comparing(ProductInventory::getLcaResult, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(4)
                .map(item -> {
                    Map<String, Object> contributor = new HashMap<>();
                    contributor.put("name", item.getProductName());
                    contributor.put("value", item.getLcaResult());
                    return contributor;
                })
                .collect(Collectors.toList());

        return new DashboardSummary(totalEmissions, topContributors);
    }
}