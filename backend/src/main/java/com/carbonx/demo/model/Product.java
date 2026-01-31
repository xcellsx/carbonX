// xcellsx/carbonx/carbonX-cells/backend/src/main/java/com/carbonx/demo/model/Product.java
package com.carbonx.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Product {
    @Id
    private String openLcaProcessId; // OpenLCA process UUID (string primary key)
    private String name;
    private String location; // Location code (e.g., "DE", "US", "GLO")

    // Constructors
    public Product() {}

    public Product(String openLcaProcessId, String name, String location) {
        this.openLcaProcessId = openLcaProcessId;
        this.name = name;
        this.location = location;
    }

    // Getters and Setters
    public String getOpenLcaProcessId() { return openLcaProcessId; }
    public void setOpenLcaProcessId(String openLcaProcessId) { this.openLcaProcessId = openLcaProcessId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}