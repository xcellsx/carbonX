package com.carbonx.lca.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "calculations")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // One-to-Many relationship: One Calculation has many Flows
    // CascadeType.ALL means if a Calculation is deleted, its associated Flows are also deleted.
    // OrphanRemoval=true ensures that if a Flow is removed from the list, it's deleted from the DB.
    @OneToMany(mappedBy = "calculation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Flow> flows = new ArrayList<>();

    // One-to-Many relationship for Impacts
    @OneToMany(mappedBy = "calculation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Impact> impacts = new ArrayList<>();

    // Default constructor for JPA
    public Calculation() {}

    // Convenience constructor
    public Calculation(Product product) {
        this.product = product;
    }

    // Helper methods to keep both sides of the relationship in sync
    public void addFlow(Flow flow) {
        flows.add(flow);
        flow.setCalculation(this);
    }

    public void addImpact(Impact impact) {
        impacts.add(impact);
        impact.setCalculation(this);
    }
}