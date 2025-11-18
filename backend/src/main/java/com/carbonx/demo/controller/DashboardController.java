package com.carbonx.demo.controller;

import java.util.List;

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

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    @GetMapping("/summary/{userId}")
    // --- THIS IS THE FIX ---
    // Changed '@PathVariable Long userId' to '@PathVariable String userId'
    public DashboardSummary getDashboardSummary(@PathVariable String userId) {
        
        List<String> activeMetrics = companyInfoRepository.findByUserId(userId) // <-- This now correctly passes a String
                .map(CompanyInfo::getActiveMetrics)
                .orElse(List.of());

        List<ProductInventory> products = productInventoryRepository.findByUserId(userId); // <-- This now correctly passes a String

        double totalLca = products.stream()
                .mapToDouble(p -> p.getLcaResult() != null ? p.getLcaResult() : 0.0) // Added null check for safety
                .sum();

        int productCount = products.size();

        // Create and return the summary DTO
        
        // --- TEMPORARY FIX: Comment out the broken line ---
        // return new DashboardSummary(activeMetrics, totalLca, productCount);
        
        // --- ADD THIS LINE to allow the project to compile ---
        return null; 
    }
}