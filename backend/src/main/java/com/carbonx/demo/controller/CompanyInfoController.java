package com.carbonx.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping; // Import the service
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.dto.CompanyInfoRequest;
import com.carbonx.demo.model.CompanyInfo;
import com.carbonx.demo.repository.CompanyInfoRepository;
import com.carbonx.demo.service.CompanyService;

@RestController
@RequestMapping("/api/company-info")
public class CompanyInfoController {

    @Autowired
    private CompanyService companyService; // Use Service instead of Repo for saving

    @Autowired
    private CompanyInfoRepository companyInfoRepository; // Keep this for the GET request

    @PostMapping
    public ResponseEntity<?> createOrUpdateCompanyInfo(@RequestBody CompanyInfoRequest request) {
        // 1. Send the DTO to the service
        // The Service handles: finding the user, saving info, and CALCULATING METRICS
        companyService.processCompanyInfo(request);

        return ResponseEntity.ok().body("{\"message\": \"Saved successfully\"}");
    }

    @GetMapping
    public List<CompanyInfo> getAllCompanyInfo() {
        return companyInfoRepository.findAll();
    }
}