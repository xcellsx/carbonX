package com.carbonx.demo.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.carbonx.demo.dto.CompanyInfoRequest;
import com.carbonx.demo.model.CompanyInfo;
import com.carbonx.demo.repository.CompanyInfoRepository;

@Service
public class CompanyService {

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    // Fallback defaults
    private static final List<String> DEFAULT_METRICS = Arrays.asList("ghg", "energy", "water");

    public void processCompanyInfo(CompanyInfoRequest request) {
        
        // 1. Create the Entity
        CompanyInfo companyInfo = new CompanyInfo();
        companyInfo.setUserId(request.getUserId());
        companyInfo.setCompanyName(request.getCompanyName());
        companyInfo.setSector(request.getSector());
        companyInfo.setIndustry(request.getIndustry());
        companyInfo.setHeadquarters(request.getHeadquarters());
        companyInfo.setReportingYear(request.getReportingYear());

        // 2. Calculate Metrics based on the Sector/Industry from request
        List<String> calculatedMetrics = determineMetrics(request.getSector(), request.getIndustry());
        
        // 3. Set the metrics directly on the company object
        companyInfo.setActiveMetrics(calculatedMetrics);

        // 4. Save everything at once
        companyInfoRepository.save(companyInfo);
    }

    private List<String> determineMetrics(String sector, String industry) {
        if (sector == null || industry == null) return DEFAULT_METRICS;

        if ("Food & Beverages".equals(sector)) {
             if ("Food Retailers & Distributors".equals(industry)) {
                return Arrays.asList(
                    "fleet-fuel-management", "energy-management", "food-waste-management",
                    "data-security", "food-safety", "product-health-nutrition",
                    "product-labelling-marketing", "labour-practices",
                    "supply-chain-impacts", "gmo"
                );
            }
            
            List<String> standardFbIndustries = Arrays.asList(
                "Agricultural Products", "Alcoholic Beverages", "(Meat, Poultry & Dairy)", 
                "Non-alcoholic Beverages", "Processed Foods", "Restaurants", "Tobacco"
            );
            
            if (standardFbIndustries.contains(industry)) {
                return Arrays.asList("ghg", "water", "sourcing", "impact");
            }
        }
        
        return DEFAULT_METRICS;
    }
}