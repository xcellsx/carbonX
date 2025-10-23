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

    @ManyToOne(optional = false)
    @JoinColumn(name = "flow_id")
    private Flow flow;

    @Column(name = "method_id")
    private String methodId;

    @Column(name = "impact_id")
    private String impactId;

    @Column(name = "impact_id_unit")
    private String impactIdUnit;

    @Column(name = "impact_value", precision = 10, scale = 4)
    private BigDecimal impactValue;
}