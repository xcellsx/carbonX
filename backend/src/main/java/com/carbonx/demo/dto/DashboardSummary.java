package com.carbonx.demo.dto;

import java.util.List;
import java.util.Map;

public class DashboardSummary {
    private int productCount;
    private List<String> activeMetrics;
    private double totalEmissions;
    private double transportEmissions; // New field for Fleet Management
    private List<Map<String, Object>> topContributors;

    // Updated Constructor
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