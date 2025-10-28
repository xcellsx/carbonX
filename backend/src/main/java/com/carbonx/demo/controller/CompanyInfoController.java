package com.carbonx.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.model.CompanyInfo;
import com.carbonx.demo.model.User;
import com.carbonx.demo.repository.CompanyInfoRepository;
import com.carbonx.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/company-info")
public class CompanyInfoController {

    @Autowired
    private CompanyInfoRepository companyInfoRepository; // FIX variable name
    @Autowired
    private UserRepository userRepository;

@PostMapping
public ResponseEntity<?> createOrUpdateCompanyInfo(@RequestBody Map<String, Object> payload) {
    Long userId = Long.valueOf(payload.get("userId").toString());
    User user = userRepository.findById(userId).orElseThrow();

    // Find existing CompanyInfo for this user
    Optional<CompanyInfo> existing = companyInfoRepository.findByUserId(userId);

    CompanyInfo info = existing.orElseGet(CompanyInfo::new);
    info.setUser(user); // Always set user!
    info.setCompanyName((String) payload.get("companyName"));
    info.setSector((String) payload.get("sector"));
    info.setIndustry((String) payload.get("industry"));
    info.setSubIndustry((String) payload.get("subIndustry"));
    info.setHeadquarters((String) payload.get("headquarters"));
    info.setReportingYear((String) payload.get("reportingYear"));

    companyInfoRepository.save(info);

    return ResponseEntity.ok(info);
}

    @GetMapping
    public List<CompanyInfo> getAllCompanyInfo() {
    return companyInfoRepository.findAll();
}
}


