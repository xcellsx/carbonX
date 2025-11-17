package com.carbonx.demo.repository;

import com.carbonx.demo.model.CompanyInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional; // Import Optional

public interface CompanyInfoRepository extends JpaRepository<CompanyInfo, Long> {
    
    // --- ADD THIS METHOD ---
    // This allows us to find an existing entry by the user's ID
    Optional<CompanyInfo> findByUserId(String userId);

    List<CompanyInfo> findAll();
}