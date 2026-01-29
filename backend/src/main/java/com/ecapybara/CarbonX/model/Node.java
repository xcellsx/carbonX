package com.ecapybara.carbonx.model;

import java.util.Map;
import java.util.Properties;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;
import com.ecapybara.carbonx.model.emissions.EmissionChart;
import com.fasterxml.jackson.annotation.JsonAlias;

public class Node {
  @ArangoId // db document field: _id
  @JsonAlias({"_id"})
  private String id;

  @Id // db document field: _key
  @JsonAlias({"_key"})
  private String key;

  private String name;
  private String type;
  private String quantifiableUnit;
  private Double quantityValue;
  private Map<String,Map<String,EmissionChart>> emissionInformation; // e.g {"Scope 1" : ExtractionEmissionCharts, "Scope 2" : ProcessingEmissionCharts, "Scope 3" : TransportationEmissionCharts}

  private Properties functionalProperties;
  private DigitalProductPassport DPP;

  // constructors
  public Node() { 
    super();
  }

  public Node(final String type) {
    super();
    this.type = type;
  }

  public Node(final String type, final String name) {
    super();
    this.name = name;
    this.type = type;
  }

  //getters and setters
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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getQuantifiableUnit() {
    return quantifiableUnit;
  }

  public void setQuantifiableUnit(String quantifiableUnit) {
    this.quantifiableUnit = quantifiableUnit;
  }

  public Double getQuantityValue() {
    return quantityValue;
  }

  public void setQuantityValue(Double quantityValue) {
    this.quantityValue = quantityValue;
  }

  public Map<String, Map<String, EmissionChart>> getEmissionInformation() {
    return emissionInformation;
  }

  public void setEmissionInformation(Map<String, Map<String, EmissionChart>> emissionInformation) {
    this.emissionInformation = emissionInformation;
  }

  public Properties getFunctionalProperties() {
    return functionalProperties;
  }

  public void setFunctionalProperties(Properties functionalProperties) {
    this.functionalProperties = functionalProperties;
  }

  public DigitalProductPassport getDPP() {
    return DPP;
  }

  public void setDPP(DigitalProductPassport dPP) {
    this.DPP = dPP;
  }  
}
