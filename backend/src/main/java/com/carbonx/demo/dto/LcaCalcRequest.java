package com.carbonx.demo.dto;

import java.util.List;

public class LcaCalcRequest {
    private Long inventoryId;
    private List<Component> components;

    public Long getInventoryId() { return inventoryId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }
    public List<Component> getComponents() { return components; }
    public void setComponents(List<Component> components) { this.components = components; }

    public static class Component {
        private String processId;
        private Double weight;

        public String getProcessId() { return processId; }
        public void setProcessId(String processId) { this.processId = processId; }
        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }
    }
}
