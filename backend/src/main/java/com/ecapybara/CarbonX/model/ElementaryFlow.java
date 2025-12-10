package com.ecapybara.carbonx.model;

import org.springframework.data.annotation.Id;

import com.arangodb.springframework.annotation.ArangoId;

public class ElementaryFlow {
  @Id // db document field: _key
  private String id;

  @ArangoId // db document field: _id
  private String arangoId;

  private String name;
  private String unit;
  private String unitType;
  private String value;

  // constructors
  public ElementaryFlow(String name) {
    this.name = name;
  }
  public ElementaryFlow(String name, String unit, String unitType) {
    this.name = name;
    this.unit = unit;
    this.unitType = unitType;
  }

  public ElementaryFlow(String name, String unit, String unitType, String value) {
    this.name = name;
    this.unit = unit;
    this.unitType = unitType;
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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }
  public String getUnitType() {
    return unitType;
  }
  public void setUnitType(String unitType) {
    this.unitType = unitType;
  }
}