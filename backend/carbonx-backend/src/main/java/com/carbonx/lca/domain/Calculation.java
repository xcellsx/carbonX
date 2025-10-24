package com.carbonx.lca.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "calculations")
public class Calculation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @OneToMany(mappedBy = "calculation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Flow> flows = new ArrayList<>();

    // FIX: Corrected typo from "mappedby" to "mappedBy"
    @OneToMany(mappedBy = "calculation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Impact> impacts = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public List<Flow> getFlows() { return flows; }
    public void setFlows(List<Flow> flows) { this.flows = flows; }
    public List<Impact> getImpacts() { return impacts; }
    public void setImpacts(List<Impact> impacts) { this.impacts = impacts; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}