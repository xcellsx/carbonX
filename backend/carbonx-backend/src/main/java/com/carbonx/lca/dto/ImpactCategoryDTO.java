package com.carbonx.lca.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ImpactCategoryDTO {
    @JsonProperty("@id")
    private String atId;
    private String name;
    private String refUnit;

    // Getters and Setters
    public String getAtId() { return atId; }
    public void setAtId(String atId) { this.atId = atId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRefUnit() { return refUnit; }
    public void setRefUnit(String refUnit) { this.refUnit = refUnit; }
}