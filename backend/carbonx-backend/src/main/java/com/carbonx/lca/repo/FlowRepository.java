package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Flow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // Import List

public interface FlowRepository extends JpaRepository<Flow, Long> {

    // Add this method definition
    List<Flow> findByProductId(Long productId);
}
