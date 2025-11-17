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

import com.carbonx.demo.model.CompanyInfo; // Import the model

@RestController
@RequestMapping("/api/company-info")
public class CompanyInfoController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    @PostMapping
    public ResponseEntity<?> createOrUpdateCompanyInfo(@RequestBody CompanyInfoRequest request) {
        // 1. Call the service and get the saved object back
        CompanyInfo savedInfo = companyService.processCompanyInfo(request);

        // 2. Return the full object (which contains the calculated activeMetrics)
        return ResponseEntity.ok().body(savedInfo);
    }

    @GetMapping
    public List<CompanyInfo> getAllCompanyInfo() {
        return companyInfoRepository.findAll();
    }
}