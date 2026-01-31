package com.carbonx.demo.dto;

import java.util.List;
import java.util.Map;

public class DashboardSummary {
    private double totalEmissions;
    private List<Map<String, Object>> topContributors; // List of {name: "...", value: ...}

    // Constructor
    public DashboardSummary(double totalEmissions, List<Map<String, Object>> topContributors) {
        this.totalEmissions = totalEmissions;
        this.topContributors = topContributors;
    }

    // Getters and Setters
    public double getTotalEmissions() {
        return totalEmissions;
    }

    public void setTotalEmissions(double totalEmissions) {
        this.totalEmissions = totalEmissions;
    }

    public List<Map<String, Object>> getTopContributors() {
        return topContributors;
    }

    public void setTopContributors(List<Map<String, Object>> topContributors) {
        this.topContributors = topContributors;
    }
}