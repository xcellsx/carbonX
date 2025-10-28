package com.carbonx.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Product {
    @Id
    private String openLcaProcessId; // OpenLCA process UUID (string primary key)
    private String name;
    private String description;
    private String unit;
    private String category;
    private Double carbonFootprint; // Optional, can be updated later from LCA

    // Constructors
    public Product() {}

    public Product(String openLcaProcessId, String name, String description, String unit, String category, Double carbonFootprint) {
        this.openLcaProcessId = openLcaProcessId;
        this.name = name;
        this.description = description;
        this.unit = unit;
        this.category = category;
        this.carbonFootprint = carbonFootprint;
    }

    // Getters and Setters
    public String getOpenLcaProcessId() { return openLcaProcessId; }
    public void setOpenLcaProcessId(String openLcaProcessId) { this.openLcaProcessId = openLcaProcessId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getCarbonFootprint() { return carbonFootprint; }
    public void setCarbonFootprint(Double carbonFootprint) { this.carbonFootprint = carbonFootprint; }
}
