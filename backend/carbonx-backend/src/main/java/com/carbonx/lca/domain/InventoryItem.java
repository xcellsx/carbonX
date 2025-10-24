package com.carbonx.lca.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.Data; // Assuming Lombok is used, otherwise generate manually

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
@Data // Lombok annotation to generate getters, setters, toString, equals, hashCode
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    // Added Category field
    @Column
    private String category;

    // Added Location field
    @Column
    private String location;

    @Column(nullable = false)
    private Double weight = 1.0; // Default weight

    @Column
    private String processId; // openLCA process UUID

    // Added Process Name field
    @Column
    private String processName; // openLCA process Name (for display)

    @Column
    private Double lcaResult; // Result for the configured primary impact category

    // Added CreatedAt field
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    // Added UpdatedAt field
    @Column(nullable = false)
    private OffsetDateTime updatedAt;


    // --- Manually added Getters and Setters ---
    // If you are NOT using Lombok (@Data), you need these methods.
    // If you ARE using Lombok, these are generated automatically and you can omit them.

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public String getProcessId() {
        return processId;
    }

    public void setProcessId(String processId) {
        this.processId = processId;
    }

    public String getProcessName() {
        return processName;
    }

    public void setProcessName(String processName) {
        this.processName = processName;
    }

    public Double getLcaResult() {
        return lcaResult;
    }

    public void setLcaResult(Double lcaResult) {
        this.lcaResult = lcaResult;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // --- End of Getters and Setters ---
}
