package com.carbonx.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.carbonx.demo.model.CompanyInfo;

@Repository
public interface CompanyInfoRepository extends JpaRepository<CompanyInfo, Long> {
    // Helps if you need to find company info by user later
    CompanyInfo findByUserId(String userId);
}