package com.carbonx.lca.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter // Ensure Lombok generates getters (like getWeight)
@Setter // Ensure Lombok generates setters (like setWeight)
@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal weight = BigDecimal.ONE; // Default to 1.0

    @Column(name = "climate_change_impact", precision = 10, scale = 4, nullable = true)
    private BigDecimal climateChangeImpact;

    @Column(name = "impact_unit", length = 50, nullable = true)
    private String impactUnit;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // Default constructor REQUIRED by JPA and Lombok (if using @AllArgsConstructor etc elsewhere)
    public InventoryItem() {}

    // Explicit constructor REQUIRED for InventoryController usage
    public InventoryItem(Product product, BigDecimal weight) {
        this.product = product;
        // Ensure weight is positive, default to 1 if null or non-positive
        if (weight != null && weight.compareTo(BigDecimal.ZERO) > 0) {
           this.weight = weight;
        } else {
           this.weight = BigDecimal.ONE;
        }
        this.createdAt = Instant.now();
    }

    // Lombok will generate:
    // getId(), setId(), getProduct(), setProduct(), getWeight(), setWeight(),
    // getClimateChangeImpact(), setClimateChangeImpact(), getImpactUnit(), setImpactUnit(),
    // getCreatedAt(), setCreatedAt()
}

