package com.ecapybara.carbonx.controller;

import java.util.List;
import java.util.Optional; // Import Optional

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // Import PathVariable
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.dto.CompanyInfoRequest;
import com.ecapybara.carbonx.model.Company;
import com.ecapybara.carbonx.repository.CompanyInfoRepository;
import com.ecapybara.carbonx.service.CompanyService;

@RestController
@RequestMapping("/api/company-info")
public class CompanyInfoController {

    @Autowired
    private CompanyService companyService; 

    @Autowired
    private CompanyInfoRepository companyInfoRepository; // Keep for the GET all

    @PostMapping
    public ResponseEntity<?> createOrUpdateCompanyInfo(@RequestBody CompanyInfoRequest request) {
        // This now handles both create AND update
        Company savedInfo = companyService.processCompanyInfo(request);
        return ResponseEntity.ok().body(savedInfo);
    }
    
    // --- ADD THIS NEW ENDPOINT ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<Company> getCompanyInfoByUserId(@PathVariable String userId) {
        Optional<Company> companyInfo = companyService.getCompanyInfoByUserId(userId);
        
        // Return 200 OK with the data, or 404 Not Found
        return companyInfo.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Company> getAllCompanyInfo() {
        return companyInfoRepository.findAll();
    }
}
