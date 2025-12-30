package com.ecapybara.carbonx.model;

import jakarta.persistence.*;
import java.util.Map;

import org.springframework.boot.autoconfigure.domain.EntityScan;

@EntityScan
public class ProductInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    private String userId; 
    private String productName;
    private String uploadedFile;

    // Increased length to handle complex DPP JSON data
    @Column(length = 4096) 
    private String dppData; 

    @ElementCollection
    @CollectionTable(name = "product_metadata", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value", length = 1024)
    private Map<String, String> metadata;

    // Getters and Setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getUploadedFile() { return uploadedFile; }
    public void setUploadedFile(String uploadedFile) { this.uploadedFile = uploadedFile; }
    public String getDppData() { return dppData; }
    public void setDppData(String dppData) { this.dppData = dppData; }
    public Double getLcaResult() { return lcaResult; }
    public void setLcaResult(Double lcaResult) { this.lcaResult = lcaResult; }
    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
}
