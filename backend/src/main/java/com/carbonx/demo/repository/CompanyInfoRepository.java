package com.carbonx.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carbonx.demo.model.CompanyInfo; // Import this

@Repository
public interface CompanyInfoRepository extends JpaRepository<CompanyInfo, Long> {
    
    // Change return type from 'CompanyInfo' to 'Optional<CompanyInfo>'
    Optional<CompanyInfo> findByUserId(String userId);
}