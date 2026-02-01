package com.ecapybara.carbonx.model;

import java.util.Map;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.fasterxml.jackson.annotation.JsonAlias;

@Document("characterizationFactors")
public class CharacterizationFactor{

  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  private String productName; // e.g "CO2"
  private ImpactCategory impactCategory; // e.g GlobalWarmingPotential
  private Map<String,Double> conversions; //eg. {"kg": 2.54, "litres": 3.22}

  // constructors
  public CharacterizationFactor() {
    super();
  }
  public CharacterizationFactor(String productName, ImpactCategory impactCategory) {
    super();
    this.productName = productName;
    this.impactCategory = impactCategory;
  }
  public CharacterizationFactor(String productName, ImpactCategory impactCategory, Map<String,Double> conversions) {
    this.productName = productName;    
    this.impactCategory = impactCategory;
    this.conversions = conversions;
  }

  // setters and getters
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
  public String getProductName() {
    return productName;
  }
  public void setProductName(String productName) {
    this.productName = productName;
  }
  public ImpactCategory getImpactCategory() {
    return impactCategory;
  }
  public void setImpactCategory(ImpactCategory impactCategory) {
    this.impactCategory = impactCategory;
  }
  public Map<String, Double> getConversions() {
    return conversions;
  }
  public void setConversions(Map<String, Double> conversions) {
    this.conversions = conversions;
  }
}
