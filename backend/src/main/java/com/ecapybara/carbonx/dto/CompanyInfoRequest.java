package com.ecapybara.carbonx.dto;

public class CompanyInfoRequest {

    private String userId;
    private String companyName;
    private String sector;
    private String industry;
    private String headquarters;
    private String reportingYear;

    // --- Constructors ---

    // Default constructor (Required for JSON parsing)
    public CompanyInfoRequest() {
    }

    public CompanyInfoRequest(String userId, String companyName, String sector, String industry, String headquarters, String reportingYear) {
        this.userId = userId;
        this.companyName = companyName;
        this.sector = sector;
        this.industry = industry;
        this.headquarters = headquarters;
        this.reportingYear = reportingYear;
    }

    // --- Getters and Setters ---

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getHeadquarters() {
        return headquarters;
    }

    public void setHeadquarters(String headquarters) {
        this.headquarters = headquarters;
    }

    public String getReportingYear() {
        return reportingYear;
    }

    public void setReportingYear(String reportingYear) {
        this.reportingYear = reportingYear;
    }

    @Override
    public String toString() {
        return "CompanyInfoRequest{" +
                "userId='" + userId + '\'' +
                ", companyName='" + companyName + '\'' +
                ", sector='" + sector + '\'' +
                ", industry='" + industry + '\'' +
                ", headquarters='" + headquarters + '\'' +
                ", reportingYear='" + reportingYear + '\'' +
                '}';
    }
}
