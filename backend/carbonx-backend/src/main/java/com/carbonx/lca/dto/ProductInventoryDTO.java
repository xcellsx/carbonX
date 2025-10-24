package com.carbonx.lca.dto;

import java.math.BigDecimal;

public class ProductInventoryDTO {

    private Long id;
    private String name;
    private BigDecimal carbonEmission;
    private String processId;

    public ProductInventoryDTO() {
    }

    public ProductInventoryDTO(Long id, String name, BigDecimal carbonEmission, String processId) {
        this.id = id;
        this.name = name;
        this.carbonEmission = carbonEmission;
        this.processId = processId;
    }

    // New constructor for the search service
    public ProductInventoryDTO(String name, String processId) {
        this.name = name;
        this.processId = processId;
    }

    // Getters and setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getCarbonEmission() { return carbonEmission; }
    public void setCarbonEmission(BigDecimal carbonEmission) { this.carbonEmission = carbonEmission; }
    public String getProcessId() { return processId; }
    public void setProcessId(String processId) { this.processId = processId; }
}