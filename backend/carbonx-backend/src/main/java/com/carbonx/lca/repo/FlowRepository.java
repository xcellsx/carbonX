package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Flow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlowRepository extends JpaRepository<Flow, Long> {

    // The problematic method "findByProductId" has been removed.
    // If you need to find flows by product, you would query through the Calculation,
    // for example: findByCalculation_Product_Id(Long productId);

}