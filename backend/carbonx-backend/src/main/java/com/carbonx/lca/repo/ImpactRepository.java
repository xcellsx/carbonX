package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Impact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImpactRepository extends JpaRepository<Impact, Long> {
    // This repository should also be clean of any custom methods
    // that don't match the properties of the Impact entity.
}