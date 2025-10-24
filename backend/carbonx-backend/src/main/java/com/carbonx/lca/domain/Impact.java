package com.carbonx.lca.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "impacts")
public class Impact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One: Many impacts belong to one Calculation
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "calculation_id")
    private Calculation calculation;

    @Column(name = "impact_category", nullable = false)
    private String categoryName;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private String unit;

    // Default constructor for JPA
    public Impact() {}

    // Convenience constructor
    public Impact(Calculation calculation, String categoryName, BigDecimal amount, String unit) {
        this.calculation = calculation;
        this.categoryName = categoryName;
        this.amount = amount;
        this.unit = unit;
    }
}