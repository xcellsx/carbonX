// src/main/java/com/carbonx/demo/model/ProductInventory.java

package com.carbonx.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_inventory")
public class ProductInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String productName;

    private String uploadedFile; // store path or file reference

    private String dppId;    // Digital Product Passport ID
    @Lob
    private String dppData;  // JSON or text, can be large

    // --- getters & setters ---
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getUploadedFile() { return uploadedFile; }
    public void setUploadedFile(String uploadedFile) { this.uploadedFile = uploadedFile; }

    public String getDppId() { return dppId; }
    public void setDppId(String dppId) { this.dppId = dppId; }

    public String getDppData() { return dppData; }
    public void setDppData(String dppData) { this.dppData = dppData; }

    @Column(length = 10000)
private String bomData; // Store CSV content as plain text (or path if you save file)

public String getBomData() { return bomData; }
public void setBomData(String bomData) { this.bomData = bomData; }

private Double lcaResult;
public Double getLcaResult() { return lcaResult; }
public void setLcaResult(Double lcaResult) { this.lcaResult = lcaResult; }


}
