package com.carbonx.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class CompanyInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String sector;
    private String industry;
    private String subIndustry;
    private String headquarters;
    private String reportingYear;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Getters
    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public String getSector() { return sector; }
    public String getIndustry() { return industry; }
    public String getSubIndustry() { return subIndustry; }
    public String getHeadquarters() { return headquarters; }
    public String getReportingYear() { return reportingYear; }
    public User getUser() { return user; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public void setSector(String sector) { this.sector = sector; }
    public void setIndustry(String industry) { this.industry = industry; }
    public void setSubIndustry(String subIndustry) { this.subIndustry = subIndustry; }
    public void setHeadquarters(String headquarters) { this.headquarters = headquarters; }
    public void setReportingYear(String reportingYear) { this.reportingYear = reportingYear; }
    public void setUser(User user) { this.user = user; }
}
