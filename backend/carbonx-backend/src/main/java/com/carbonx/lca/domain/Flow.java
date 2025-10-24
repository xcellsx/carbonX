package com.carbonx.lca.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "flows")
public class Flow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many-to-One: Many flows belong to one Calculation
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "calculation_id")
    private Calculation calculation;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private boolean isInput;

    // Default constructor for JPA
    public Flow() {}

    // Convenience constructor
    public Flow(Calculation calculation, String name, String category, BigDecimal amount, String unit, boolean isInput) {
        this.calculation = calculation;
        this.name = name;
        this.category = category;
        this.amount = amount;
        this.unit = unit;
        this.isInput = isInput;
    }
}