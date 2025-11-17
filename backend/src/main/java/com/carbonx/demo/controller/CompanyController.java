// src/main/java/com/carbonx/controller/CompanyController.java
package com.carbonx.demo.controller;

import com.carbonx.demo.dto.CompanyInfoRequest;
import com.carbonx.demo.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @PostMapping("/company-info")
    public ResponseEntity<?> saveCompanyInfo(@RequestBody CompanyInfoRequest request) {
        try {
            companyService.processCompanyInfo(request);
            return ResponseEntity.ok().body("{\"message\": \"Company info and metrics saved successfully\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"message\": \"Error processing data\"}");
        }
    }
}