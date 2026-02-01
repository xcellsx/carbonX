package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;

public class Metric {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  private String unit;
  private Double value;

  // constructors
  public Metric() {
    super();
  }

  public Metric(Double value, String unit) {
    super();
    this.unit = unit;
    this.value = value;
  }

  // setters and getters
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

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
  }

  public Double getValue() {
    return value;
  }

  public void setValue(Double value) {
    this.value = value;
  }
}
