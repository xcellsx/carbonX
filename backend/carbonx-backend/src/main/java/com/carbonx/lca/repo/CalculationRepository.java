package com.carbonx.lca.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.lca.domain.Calculation;

public interface CalculationRepository extends JpaRepository<Calculation, Long> {}


