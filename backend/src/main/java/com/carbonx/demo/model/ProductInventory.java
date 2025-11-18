package com.carbonx.demo.model;

import jakarta.persistence.*;
import java.util.Map; // Import Map

@Entity
public class ProductInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    private String userId; 
    private String productName;
    private String uploadedFile;

    @Column(length = 2048) 
    private String dppData; 
    
    private Double lcaResult;

    // --- THIS IS THE FIX ---
    // This tells JPA to store the metadata object from your frontend
    // in a separate table linked to this product.
    @ElementCollection
    @CollectionTable(name = "product_metadata", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value", length = 1024) // Added length for safety
    private Map<String, String> metadata;
    // --- END FIX ---

    // Getters and Setters
    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getUploadedFile() {
        return uploadedFile;
    }

    public void setUploadedFile(String uploadedFile) {
        this.uploadedFile = uploadedFile;
    }

    public String getDppData() {
        return dppData;
    }

    public void setDppData(String dppData) {
        this.dppData = dppData;
    }

    public Double getLcaResult() {
        return lcaResult;
    }

    public void setLcaResult(Double lcaResult) {
        this.lcaResult = lcaResult;
    }

    // --- ADD GETTER/SETTER FOR METADATA ---
    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
}