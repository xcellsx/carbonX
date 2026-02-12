package com.ecapybara.carbonx.controller;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.basic.Company;
import com.ecapybara.carbonx.repository.CompanyRepository;

import org.apache.commons.collections4.IterableUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/company")
public class CompanyInfoController {

  final Sort sort = Sort.by(Direction.DESC, "id");

  @Autowired
  private CompanyRepository companyRepository;

  // Unfinished
  @GetMapping
  public Company getCompanyInfo() {
    return IterableUtils.toList(companyRepository.findAll()).get(0);
  }

  @PostMapping
  public Company createCompany(@RequestBody Company company) {
    companyRepository.save(company);
    company = IterableUtils.toList(companyRepository.findByName(sort, company.getName())).get(0);

    return company;
  }
  
  @GetMapping("/name")
  public String getCompanyName() {
    return IterableUtils.toList(companyRepository.findAll()).get(0).getName();
  }

  @GetMapping("/metrics")
  public List<String> getCompanyMetrics() {
    return IterableUtils.toList(companyRepository.findAll()).get(0).getApplicableMetrics();
  }

  @GetMapping("/sector")
  public String getCompanySector() {
    return IterableUtils.toList(companyRepository.findAll()).get(0).getSector();
  }

  @GetMapping("/industry")
  public String getCompanyIndustry() {
    return IterableUtils.toList(companyRepository.findAll()).get(0).getIndustry();
  }
}