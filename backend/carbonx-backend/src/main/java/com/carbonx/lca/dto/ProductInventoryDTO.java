package com.carbonx.lca.dto;

import java.math.BigDecimal;

// Simple DTO to combine Product info and its primary LCA result
public class ProductInventoryDTO {
    private Long id;
    private String name;
    private BigDecimal climateChangeImpact; // kgCO2e value
    private String impactUnit; // e.g., "kg CO2 eq."

    // Constructors
    public ProductInventoryDTO() {}

    public ProductInventoryDTO(Long id, String name, BigDecimal climateChangeImpact, String impactUnit) {
        this.id = id;
        this.name = name;
        this.climateChangeImpact = climateChangeImpact;
        this.impactUnit = impactUnit;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getClimateChangeImpact() { return climateChangeImpact; }
    public void setClimateChangeImpact(BigDecimal climateChangeImpact) { this.climateChangeImpact = climateChangeImpact; }
    public String getImpactUnit() { return impactUnit; }
    public void setImpactUnit(String impactUnit) { this.impactUnit = impactUnit; }
}