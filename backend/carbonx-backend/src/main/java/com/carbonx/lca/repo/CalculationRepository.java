package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Calculation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CalculationRepository extends JpaRepository<Calculation, Long> {

    // Custom query method to find the most recent calculation for a given product ID
    Optional<Calculation> findFirstByProductIdOrderByCreatedAtDesc(Long productId);
}