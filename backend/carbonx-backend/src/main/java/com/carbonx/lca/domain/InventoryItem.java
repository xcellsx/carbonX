package com.carbonx.lca.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String dppFile;

    @Column(nullable = false)
    private double weight = 1.0;

    @Column(name = "process_id")
    private String processId;

    @Column(name = "lca_result")
    private Double lcaResult;

    // Getters and Setters
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
    public String getDppFile() {
        return dppFile;
    }
    public void setDppFile(String dppFile) {
        this.dppFile = dppFile;
    }
    public double getWeight() {
        return weight;
    }
    public void setWeight(double weight) {
        this.weight = weight;
    }
    public String getProcessId() {
        return processId;
    }
    public void setProcessId(String processId) {
        this.processId = processId;
    }
    public Double getLcaResult() {
        return lcaResult;
    }
    public void setLcaResult(Double lcaResult) {
        this.lcaResult = lcaResult;
    }
}