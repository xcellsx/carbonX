package com.ecapybara.carbonx.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional; // Import Optional

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ecapybara.carbonx.dto.CompanyInfoRequest;
import com.ecapybara.carbonx.model.CompanyInfo;
import com.ecapybara.carbonx.repository.CompanyInfoRepository;

@Service
public class CompanyService {

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    // Fallback defaults
    private static final List<String> DEFAULT_METRICS = Arrays.asList("ghg", "energy", "water");

    // --- THIS METHOD IS NOW UPDATED ---
    public CompanyInfo processCompanyInfo(CompanyInfoRequest request) {
        
        // 1. Find existing info for this user, OR create a new one if not found
        CompanyInfo companyInfo = companyInfoRepository.findByUserId(request.getUserId())
                .orElse(new CompanyInfo()); // This is the "find or create" logic

        // 2. Set (or update) all fields from the request
        companyInfo.setUserId(request.getUserId());
        companyInfo.setCompanyName(request.getCompanyName());
        companyInfo.setSector(request.getSector());
        companyInfo.setIndustry(request.getIndustry());
        companyInfo.setHeadquarters(request.getHeadquarters());
        companyInfo.setReportingYear(request.getReportingYear());

        // 3. Calculate Metrics
        List<String> calculatedMetrics = determineMetrics(request.getSector(), request.getIndustry());
        
        // 4. Set the metrics
        companyInfo.setActiveMetrics(calculatedMetrics);

        // 5. Save (this will either INSERT or UPDATE thanks to JPA)
        return companyInfoRepository.save(companyInfo);
    }

    // --- ADD THIS NEW METHOD for the Dashboard to call ---
    public Optional<CompanyInfo> getCompanyInfoByUserId(String userId) {
        return companyInfoRepository.findByUserId(userId);
    }

    // --- (determineMetrics method remains unchanged) ---
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
