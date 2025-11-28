package com.ecapybara.carbonx.model;

import java.util.List;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;

public class Company {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  private String name;
  private String sector;
  private String industry;
  private String headquarters;
  private String reportingYear;

  private List<String> applicableMetrics;

  // constructors
  public Company(String name, String sector) {
    super();
    this.name = name;
    this.sector = sector;
  }

  public Company(String name, String sector, String industry, String headquarters, String reportingYear) {
    this.name = name;
    this.sector = sector;
    this.industry = industry;
    this.headquarters = headquarters;
    this.reportingYear = reportingYear;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getArangoId() {
    return arangoId;
  }

  public void setArangoId(String arangoId) {
    this.arangoId = arangoId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
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

  public List<String> getApplicableMetrics() {
    return applicableMetrics;
  }

  public void setApplicableMetrics(List<String> applicableMetrics) {
    this.applicableMetrics = applicableMetrics;
  }

  // getters & setters
  
}
