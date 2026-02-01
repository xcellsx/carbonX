package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.fasterxml.jackson.annotation.JsonAlias;

@Document("impactCategories")
public class ImpactCategory {
  @Id // db document field: _key
  @JsonAlias({"_id"})
  private String id;
  @ArangoId // db document field: _id
  @JsonAlias({"_key"})
  private String key;
  
  private String name; // e.g Global Warming Potential (GWP)
  private String unit; //e.g kg CO2e

  // constructors
  public ImpactCategory() {
    super();
  }
  public ImpactCategory(String name, String unit) {
    super();
    this.name = name;
    this.unit = unit;
  }

  // getters and setters
  public String getId() {
    return id;
  }
  public void setId(String id) {
    this.id = id;
  }
  public String getKey() {
    return key;
  }
  public void setKey(String key) {
    this.key = key;
  }
  public void setName(String name) {
    this.name = name;
  }  
  public String getName() {
    return name;
  }
  public String getUnit() {
    return unit;
  }
  public void setUnit(String unit) {
    this.unit = unit;
  }  
}
