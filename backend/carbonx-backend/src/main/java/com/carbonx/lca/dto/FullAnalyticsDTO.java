package com.carbonx.lca.dto;

import java.util.List;

public class FullAnalyticsDTO {
    private List<ImpactResultDTO> topImpacts;
    private List<InventoryFlowDTO> inventory;

    // Getters and Setters
    public List<ImpactResultDTO> getTopImpacts() { return topImpacts; }
    public void setTopImpacts(List<ImpactResultDTO> topImpacts) { this.topImpacts = topImpacts; }
    public List<InventoryFlowDTO> getInventory() { return inventory; }
    public void setInventory(List<InventoryFlowDTO> inventory) { this.inventory = inventory; }
}