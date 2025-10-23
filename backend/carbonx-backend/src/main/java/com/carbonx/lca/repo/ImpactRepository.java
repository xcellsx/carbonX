package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Impact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // Import List
import java.util.Optional; // Add this import

public interface ImpactRepository extends JpaRepository<Impact, Long> {

    // Add this method definition
    List<Impact> findByFlowId(Long flowId);

    Optional<Impact> findFirstByFlowIdAndImpactIdContainingIgnoreCase(Long flowId, String impactId);
}
