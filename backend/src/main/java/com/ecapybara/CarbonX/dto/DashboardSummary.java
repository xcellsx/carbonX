package com.ecapybara.carbonx.dto;

import java.util.List;
import java.util.Map;

public class DashboardSummary {
    // --- 1. Total Number of Products (From Backend) ---
    private int productCount;
    
    // --- 2. Corresponding Metrics (From Company Info) ---
    private List<String> activeMetrics;
    
    // --- 3. Calculated Data (For the Charts) ---
    private double totalEmissions;      
    private double transportEmissions;  
    private List<Map<String, Object>> topContributors; 

    // Constructor
    public DashboardSummary(int productCount, List<String> activeMetrics, double totalEmissions, double transportEmissions, List<Map<String, Object>> topContributors) {
        this.productCount = productCount;
        this.activeMetrics = activeMetrics;
        this.totalEmissions = totalEmissions;
        this.transportEmissions = transportEmissions;
        this.topContributors = topContributors;
    }

    // Getters and Setters
    public int getProductCount() { return productCount; }
    public void setProductCount(int productCount) { this.productCount = productCount; }

    public List<String> getActiveMetrics() { return activeMetrics; }
    public void setActiveMetrics(List<String> activeMetrics) { this.activeMetrics = activeMetrics; }

    public double getTotalEmissions() { return totalEmissions; }
    public void setTotalEmissions(double totalEmissions) { this.totalEmissions = totalEmissions; }

    public double getTransportEmissions() { return transportEmissions; }
    public void setTransportEmissions(double transportEmissions) { this.transportEmissions = transportEmissions; }

    public List<Map<String, Object>> getTopContributors() { return topContributors; }
    public void setTopContributors(List<Map<String, Object>> topContributors) { this.topContributors = topContributors; }
}
