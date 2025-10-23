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

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "input_id")
    private String inputId;

    @Column(name = "input_unit")
    private String inputUnit;

    @Column(name = "input_value", precision = 10, scale = 4)
    private BigDecimal inputValue;

    @Column(name = "output_id")
    private String outputId;

    @Column(name = "output_unit")
    private String outputUnit;

    @Column(name = "output_value", precision = 10, scale = 4)
    private BigDecimal outputValue;
}